/**
 * Index file for getPosts scene
 */
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
import { createTasksForAllUsernames } from "./taskHandler";

/**
 * Scene to get interaction tasks
 */
const getPostsScene = new Scenes.BaseScene<any>("get-posts");

/**
 * Add cancel button handler
 */
getPostsScene.action("cancel_posts", async (ctx) => {
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
getPostsScene.enter(async (ctx) => {
  const telegramId = ctx.from?.id?.toString();

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
    // Get user data directly from database
    const usersCollection = getCollection<ITelegramUser>("interactXTgUsers");
    const userData = await usersCollection.findOne({ userId: telegramId });

    // Check if user hasn't set up profile
    if (!userData) {
      await ctx.reply(
        `❌ You haven't set up your profile. Please use the ${COMMANDS.SETUP} command before getting tasks.`,
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
        `❌ You haven't set up any X usernames. Please use the ${COMMANDS.SETUP} command to add your usernames before getting tasks.`,
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

    // Record start time without showing a loading message
    const startTime = Date.now();
    // Store in scene state so it can be accessed in createTasksForAllUsernames
    ctx.scene.state.startTime = startTime;

    // Create tasks for all usernames at once
    await createTasksForAllUsernames(
      ctx,
      userData.userId,
      userData.registeredUsernames
    );
  } catch (error) {
    logger.error(`Error fetching user data: ${error}`);
    await ctx.reply(
      `❌ Error retrieving your profile data. Please try again later.`,
      {
        reply_markup: KEYBOARDS.MAIN,
      }
    );
    return ctx.scene.leave();
  }
});

export default getPostsScene;
