import { Scenes } from "telegraf";
import { message } from "telegraf/filters";
import { logger } from "../../../../utils/logger";
import {
  BUTTONS,
  COMMANDS,
  KEYBOARDS,
  MESSAGES,
} from "../../../../utils/constants/botCommands";
import { NAV_KEYBOARDS } from "../../../../utils/constants/navKeyboards";
import { TaskManager } from "../../../../class";
import { ITelegramUser } from "../../../../utils/interfaces";
import { getCollection } from "../../../../utils/mongoDb";

// Scene for showing user's links and progress
const myLinksScene = new Scenes.BaseScene<any>("my-links");

// Handler when entering the scene
myLinksScene.enter(async (ctx) => {
  const telegramId = ctx.from?.id?.toString();

  // Check if user's ID is available
  if (!telegramId) {
    await ctx.reply(
      `❌ Could not identify your account. Please try again or contact support.`,
      {
        reply_markup: {
          ...KEYBOARDS.MAIN,
          inline_keyboard: NAV_KEYBOARDS.START_MENU.inline_keyboard,
        },
      }
    );
    return ctx.scene.leave();
  }

  try {
    // Get user data from database
    const usersCollection = getCollection<ITelegramUser>("interactXTgUsers");
    const userData = await usersCollection.findOne({ userId: telegramId });

    // Check if user has set up profile
    if (
      !userData ||
      !userData.registeredUsernames ||
      userData.registeredUsernames.length === 0
    ) {
      await ctx.reply(
        `❌ You haven't set up your profile. Please use ${COMMANDS.SETUP} command first.`,
        {
          reply_markup: {
            ...KEYBOARDS.MAIN,
            inline_keyboard: NAV_KEYBOARDS.START_MENU.inline_keyboard,
          },
        }
      );
      return ctx.scene.leave();
    }

    // Get links for each username
    const taskManager = new TaskManager();
    const usernames = userData.registeredUsernames;

    // Skip loading message and fetch data directly

    // Display links for each username
    let foundLinks = false;

    for (const username of usernames) {
      // Truy vấn trực tiếp từ cơ sở dữ liệu thay vì dùng phương thức không tồn tại
      const linksCollection = getCollection("interactXTaskLinks");
      const userLinks = await linksCollection
        .find({ telegramUserId: telegramId, xUsername: username })
        .toArray();

      if (userLinks && userLinks.length > 0) {
        foundLinks = true;

        // Create message with links
        let message = `📊 <b>Links for @${username}</b>\n\n`;
        message += `Total links: ${userLinks.length}\n\n`;

        // Show up to 10 links to avoid message length limits
        const displayLinks = userLinks.slice(0, 10);

        displayLinks.forEach((link, index) => {
          message += `${index + 1}. ${link.linkUrl || link.url || "No URL"}\n`;
          message += `   Status: ${link.interactionsCompleted || 0}/${
            link.interactionsRequired || 5
          } interactions\n\n`;
        });

        if (userLinks.length > 10) {
          message += `... and ${userLinks.length - 10} more links\n`;
        }

        // Send message with inline keyboard
        await ctx.reply(message, {
          parse_mode: "HTML",
          reply_markup: NAV_KEYBOARDS.MY_LINKS,
        });
      }
    }

    // If no links found
    if (!foundLinks) {
      await ctx.reply(
        `📊 <b>Your Links</b>\n\n` +
          `You haven't posted any links yet.\n\n` +
          `To post links, use the "${BUTTONS.POST_LINKS}" button or ${COMMANDS.POST} command.`,
        {
          parse_mode: "HTML",
          reply_markup: {
            ...KEYBOARDS.MAIN,
            inline_keyboard: NAV_KEYBOARDS.START_MENU.inline_keyboard,
          },
        }
      );
    }

    // Exit the scene
    return ctx.scene.leave();
  } catch (error) {
    logger.error(`Error in myLinksScene: ${error}`);
    await ctx.reply(
      `❌ <b>Error</b>\n\nFailed to retrieve your links: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      {
        parse_mode: "HTML",
        reply_markup: {
          ...KEYBOARDS.MAIN,
          inline_keyboard: NAV_KEYBOARDS.START_MENU.inline_keyboard,
        },
      }
    );
    return ctx.scene.leave();
  }
});

export { myLinksScene };
