/**
 * Index file for checkInteractions scene
 */
import { Scenes } from "telegraf";
import { message } from "telegraf/filters";
import {
  BUTTONS,
  COMMANDS,
  KEYBOARDS,
  MESSAGES,
} from "../../../../../utils/constants/botCommands";
import { NAV_KEYBOARDS } from "../../../../../utils/constants/navKeyboards";
import { ITelegramUser } from "../../../../../utils/interfaces";
import { logger } from "../../../../../utils/logger";
import { getCollection } from "../../../../../utils/mongoDb";
import { checkInteractionsForAllUsernames } from "./interactionHandler";

/**
 * Scene to check interaction status
 */
const checkInteractionsScene = new Scenes.BaseScene<any>("check-interactions");

/**
 * Add cancel button handler
 */
checkInteractionsScene.action("cancel_check", async (ctx) => {
  try {
    logger.info(`Cancel button clicked by user ${ctx.from?.id}`);
    await ctx.answerCbQuery("Operation cancelled");

    // Try to delete the current message
    try {
      await ctx.deleteMessage();
    } catch (deleteError) {
      logger.error(`Could not delete message: ${deleteError}`);
    }

    // Send a new message with the welcome text and main menu
    await ctx.reply(`${MESSAGES.CANCEL_OPERATION}\n\n${MESSAGES.WELCOME}`, {
      parse_mode: "HTML",
      reply_markup: NAV_KEYBOARDS.START_MENU,
    });

    return ctx.scene.leave();
  } catch (error) {
    logger.error(`Error handling cancel button: ${error}`);

    await ctx.reply("Operation cancelled due to an error", {
      reply_markup: NAV_KEYBOARDS.START_MENU,
    });
    return ctx.scene.leave();
  }
});

/**
 * Handler when entering the scene
 */
checkInteractionsScene.enter(async (ctx) => {
  const telegramId = ctx.from?.id?.toString();
  const username = ctx.scene.state?.username;

  // Log scene enter for debugging
  logger.info(
    `Entered check-interactions scene. TelegramId: ${telegramId}, State: ${JSON.stringify(
      ctx.scene.state
    )}`
  );

  // Check if user's ID is available
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
    // Get user data from database
    const usersCollection = getCollection<ITelegramUser>("interactXTgUsers");
    const userData = await usersCollection.findOne({ userId: telegramId });

    // Check if user hasn't set up profile
    if (!userData) {
      await ctx.reply(
        `❌ You haven't set up your profile. Please use the ${COMMANDS.SETUP} command before checking interactions.`,
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

    // Check if user has set up X usernames
    if (
      !userData.registeredUsernames ||
      userData.registeredUsernames.length === 0
    ) {
      await ctx.reply(
        `❌ You haven't set up any X usernames. Please use the ${COMMANDS.SETUP} command to add your usernames before checking interactions.`,
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

    // If specific username was provided, check only that username
    if (username) {
      // Verify if the username is registered to this user
      if (!userData.registeredUsernames.includes(username)) {
        await ctx.reply(
          `❌ Username @${username} is not registered in your profile. Please check your usernames with /profile command.`,
          {
            reply_markup: KEYBOARDS.MAIN,
          }
        );
        return ctx.scene.leave();
      }

      // Show loading message
      await ctx.reply(
        `⏳ <b>Checking interactions for @${username}</b>\n\nPlease wait while we verify your interactions for this account...`,
        { parse_mode: "HTML" }
      );

      // Check interactions for the specific username
      const { checkInteractionsForUsername } = require("./interactionHandler");
      await checkInteractionsForUsername(ctx, telegramId, username);
    } else {
      // Check all usernames
      await ctx.reply(
        `⏳ <b>Checking interactions for all your accounts</b>\n\nPlease wait while we verify your interactions...`,
        { parse_mode: "HTML" }
      );

      // Check interactions for all usernames

      await checkInteractionsForAllUsernames(ctx, telegramId);
    }
  } catch (error) {
    logger.error(`Error in check-interactions scene: ${error}`);
    await ctx.reply(
      `❌ Error retrieving account data. Please try again later.`,
      {
        reply_markup: KEYBOARDS.MAIN,
      }
    );
    return ctx.scene.leave();
  }
});

// Handle text messages
checkInteractionsScene.on(message("text"), async (ctx) => {
  const text = ctx.message.text;

  // Just handle cancel for now
  if (text === "❌ Cancel") {
    await ctx.reply(MESSAGES.CANCEL_OPERATION, {
      reply_markup: KEYBOARDS.MAIN,
    });
    return ctx.scene.leave();
  }

  // All other messages
  await ctx.reply(
    "Please wait while we check your interactions or use /cancel to exit.",
    {
      reply_markup: KEYBOARDS.MAIN,
    }
  );
});

export default checkInteractionsScene;
