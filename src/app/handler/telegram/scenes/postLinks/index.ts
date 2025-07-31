import { Scenes } from "telegraf";
import { message } from "telegraf/filters";
import { logger } from "../../../../../utils/logger";
import {
  BUTTONS,
  COMMANDS,
  KEYBOARDS,
  MESSAGES,
} from "../../../../../utils/constants/botCommands";
import { NAV_KEYBOARDS } from "../../../../../utils/constants/navKeyboards";
import { ITelegramUser } from "../../../../../utils/interfaces";
import { getCollection } from "../../../../../utils/mongoDb";
import { isXPostLinks, extractXLinks } from "./linkUtils";
import {
  autoProcessUserLinks,
  processUserLinks,
  saveUserLinks,
} from "./linkProcessor";
import { promptForLinks } from "./creditHandler";

/**
 * Scene to post links for interactions
 */
const postLinksScene = new Scenes.BaseScene<any>("post-links");

// Handler for callback queries from inline keyboards
postLinksScene.action(/^(credits|profile|cancel)$/, async (ctx) => {
  const action = ctx.match[1];

  // Remove the inline keyboard
  try {
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
  } catch (err) {
    // Ignore errors if keyboard already removed
  }

  // Handle the command
  switch (action) {
    case "credits":
      await ctx.scene.leave();
      // Directly execute the command instead of entering scene
      return ctx.reply(`Use ${COMMANDS.CREDITS} to check your credits.`, {
        reply_markup: KEYBOARDS.MAIN,
      });
    case "profile":
      await ctx.scene.leave();
      // Directly execute the command instead of entering scene
      return ctx.reply(`Use ${COMMANDS.PROFILE} to view your profile.`, {
        reply_markup: KEYBOARDS.MAIN,
      });
    case "cancel":
    default:
      await ctx.reply(`${MESSAGES.CANCEL_OPERATION}\n\n${MESSAGES.WELCOME}`, {
        parse_mode: "HTML",
        reply_markup: NAV_KEYBOARDS.START_MENU,
      });
      return ctx.scene.leave();
  }
});

// Handler when entering the scene
postLinksScene.enter(async (ctx) => {
  ``;
  const telegramId = ctx.from?.id?.toString();

  // Check if telegramId is available
  if (!telegramId) {
    await ctx.reply(
      `❌ Could not identify your account. Please try again or contact support.`,
      {
        reply_markup: {
          keyboard: [
            [{ text: BUTTONS.SETUP_PROFILE }],
            [{ text: BUTTONS.HELP }],
          ],
          resize_keyboard: true,
        },
      }
    );
    return ctx.scene.leave();
  }

  try {
    // Get user data directly from database, including any detected links
    const usersCollection = getCollection<ITelegramUser>("interactXTgUsers");
    const userData = await usersCollection.findOne({ userId: telegramId });

    // Check if the user hasn't set up their profile
    if (
      !userData ||
      !userData.registeredUsernames ||
      userData.registeredUsernames.length === 0
    ) {
      await ctx.reply(
        `❌ You haven't set up your profile. Please use ${COMMANDS.SETUP} command before posting links.`,
        {
          reply_markup: {
            keyboard: [
              [{ text: BUTTONS.SETUP_PROFILE }],
              [{ text: BUTTONS.HELP }],
            ],
            resize_keyboard: true,
          },
        }
      );
      return ctx.scene.leave();
    }

    // Store user data in session for later use
    ctx.session.userData = {
      telegramId: userData.userId,
      usernames: userData.registeredUsernames,
    };

    // Check if message contains links
    if (ctx.message && ctx.message.text && isXPostLinks(ctx.message.text)) {
      const links = extractXLinks(ctx.message.text);
      console.log("message contains links");
      console.log("links:", links);

      // Process links automatically without asking for username selection
      await autoProcessUserLinks(
        ctx,
        userData.userId,
        userData.registeredUsernames,
        links
      );
      return ctx.scene.leave();
    }

    // Provide general instruction for posting links
    const usernamesText = userData.registeredUsernames
      .map((u) => `@${u}`)
      .join(", ");

    await ctx.reply(
      `🔗 <b>Post links for interactions</b>\n\n` +
        `Your registered usernames: ${usernamesText}\n\n` +
        `Simply paste your Twitter/X links and the system will automatically:\n` +
        `1️⃣ Match each link to the correct username\n` +
        `2️⃣ Check available credits for each username\n` +
        `3️⃣ Process links that have sufficient credits\n\n` +
        `Please paste your links now or type /cancel to exit.`,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [{ text: "❌ Cancel", callback_data: "cancel_setup" }],
          ],
        },
      }
    );
  } catch (error) {
    logger.error(`Error in postLinksScene: ${error}`);
    await ctx.reply(
      `❌ Error retrieving your profile data. Please try again later.`,
      {
        reply_markup: KEYBOARDS.MAIN,
      }
    );
    return ctx.scene.leave();
  }
});

// Handler for text messages
postLinksScene.on(message("text"), async (ctx) => {
  const text = ctx.message.text;
  const userData = ctx.session.userData;

  if (!userData) {
    await ctx.reply(
      `❌ Session data is missing. Please restart by typing /post command.`,
      {
        reply_markup: KEYBOARDS.MAIN,
      }
    );
    return ctx.scene.leave();
  }

  // Check for cancel command
  if (text.toLowerCase() === COMMANDS.CANCEL) {
    await ctx.reply(MESSAGES.CANCEL_OPERATION, {
      reply_markup: KEYBOARDS.MAIN,
    });
    return ctx.scene.leave();
  }

  // If waiting for username selection
  if (ctx.session.usernameSelection) {
    if (text === "❌ Cancel") {
      await ctx.reply(MESSAGES.CANCEL_OPERATION, {
        reply_markup: KEYBOARDS.MAIN,
      });
      return ctx.scene.leave();
    }

    // Check if selected username is valid
    if (userData.usernames.includes(text)) {
      ctx.session.usernameSelection = false;
      ctx.session.selectedUsername = text;

      // If the user previously sent links, process them now
      if (ctx.session.pendingLinks && ctx.session.pendingLinks.length > 0) {
        await processUserLinks(
          ctx,
          userData.telegramId,
          text,
          ctx.session.pendingLinks
        );
        return ctx.scene.leave();
      } else {
        await promptForLinks(ctx, userData.telegramId, text);
      }
      return;
    } else {
      await ctx.reply(
        "❌ Invalid username selection. Please select from the options below:",
        {
          reply_markup: {
            keyboard: userData.usernames.map((username: string) => [
              { text: username },
            ]),
            resize_keyboard: true,
          },
        }
      );
      return;
    }
  }

  // Check if text contains X links - direct link posting mode
  if (isXPostLinks(text)) {
    const links = extractXLinks(text);

    // Process links automatically without asking for username selection
    await autoProcessUserLinks(
      ctx,
      userData.telegramId,
      userData.usernames,
      links
    );
    return ctx.scene.leave();
  }

  // If waiting for link input
  if (ctx.session.waitingForLinks && ctx.session.selectedUsername) {
    // Parse and validate links
    const links = text
      .split("\n")
      .map((link) => link.trim())
      .filter(
        (link) =>
          (link && link.includes("twitter.com")) || link.includes("x.com")
      );

    // Check if no valid links found
    if (links.length === 0) {
      return ctx.reply(
        "❌ No valid Twitter/X links found.\n\n" +
          "Please enter your links again, one link per line.\n" +
          "Or send /cancel to cancel."
      );
    }

    await saveUserLinks(
      ctx,
      userData.telegramId,
      ctx.session.selectedUsername,
      links
    );
    return;
  }

  // Check if the message is a command or button in the middle of posting
  if (
    Object.values(COMMANDS).includes(text) ||
    Object.values(BUTTONS).includes(text)
  ) {
    await ctx.reply(MESSAGES.BUSY_IN_SCENE);
    return;
  }

  // Default response for unexpected input
  await ctx.reply(
    "Please select an option from the keyboard or use /cancel to exit.",
    {
      reply_markup: KEYBOARDS.MAIN,
    }
  );
});

// Handler for non-text messages
postLinksScene.on(message(), async (ctx) => {
  await ctx.reply(
    "❌ Please send only text messages containing links.\n\n" +
      "Enter your list of links, one link per line.\n" +
      "Or send /cancel to cancel."
  );
});

export default postLinksScene;
