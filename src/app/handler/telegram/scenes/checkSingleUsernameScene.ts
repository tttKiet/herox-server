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
import { ITelegramUser, ITaskLink } from "../../../../utils/interfaces";
import { getCollection } from "../../../../utils/mongoDb";

// Scene to check interaction status for a single username
const checkSingleUsernameScene = new Scenes.BaseScene<any>(
  "check-single-username"
);

// Set initial data when entering the scene
checkSingleUsernameScene.enter(async (ctx) => {
  const telegramId = ctx.from?.id?.toString();

  // Log scene enter for debugging
  logger.info(
    `Entered check-single-username scene. State: ${JSON.stringify(
      ctx.scene.state
    )}`
  );

  // Get the specified username from context
  const username = ctx.scene.state?.username;

  if (!username) {
    logger.error(
      `No username specified in scene state: ${JSON.stringify(ctx.scene.state)}`
    );
    await ctx.reply(
      "❌ No username specified. Please use /check <username> to check a specific account.",
      {
        reply_markup: {
          ...KEYBOARDS.MAIN,
          inline_keyboard: NAV_KEYBOARDS.START_MENU.inline_keyboard,
        },
      }
    );
    return ctx.scene.leave();
  }

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
        `❌ You haven't set up your profile. Please use the ${COMMANDS.SETUP} command before checking tasks.`,
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
        `❌ You haven't set up any X usernames. Please use the ${COMMANDS.SETUP} command to add your usernames before checking tasks.`,
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
    await checkInteractionsForUsername(ctx, telegramId, username);
  } catch (error) {
    logger.error(`Error checking interactions for single username: ${error}`);
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
checkSingleUsernameScene.on(message("text"), async (ctx) => {
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

/**
 * Check interactions for a specific username
 */
async function checkInteractionsForUsername(
  ctx: any,
  telegramUserId: string,
  username: string
): Promise<void> {
  try {
    // Create task manager
    const taskManager = new TaskManager();

    // Get task details for the username
    const taskDetails = await taskManager.getTaskDetails(
      telegramUserId,
      username
    );

    if (
      !taskDetails.success ||
      !taskDetails.tasks ||
      taskDetails.tasks.length === 0
    ) {
      await ctx.reply(
        `❌ <b>No active task found for @${username}</b>\n\nYou don't have any active task for this username. Use /get to get new tasks.`,
        {
          parse_mode: "HTML",
          reply_markup: KEYBOARDS.MAIN,
        }
      );
      return ctx.scene.leave();
    }

    const task = taskDetails.tasks[0]; // Lấy task đầu tiên
    const allLinks = taskDetails.allLinks || [];
    const initialCompletedLinks = task.completedLinks;
    const wasAlreadyCompleted = task.status === "done";
    let newlyCompletedLinks = 0;

    // Check interactions for each pending link
    const pendingLinks = allLinks.filter((link) => link.status === "pending");

    if (pendingLinks.length > 0) {
      await ctx.reply(
        `⏳ <b>Checking interactions for @${username}</b>\n\nVerifying interactions for ${pendingLinks.length} pending links...`,
        { parse_mode: "HTML" }
      );
    }

    for (const link of pendingLinks) {
      // Check if user has interacted with this link
      const hasInteracted = await checkIfInteracted(username, link.postUrl);

      if (hasInteracted) {
        // Update interaction status in database
        const updated = await taskManager.updateTaskLinkInteraction(
          task._id?.toString() || "",
          link.postId,
          true
        );

        if (updated) {
          newlyCompletedLinks++;
        }
      }
    }

    // Get updated task details
    const updatedTaskDetails = await taskManager.getTaskDetails(
      telegramUserId,
      username
    );

    let isNowCompleted = false;
    if (
      updatedTaskDetails.success &&
      updatedTaskDetails.tasks &&
      updatedTaskDetails.tasks.length > 0
    ) {
      isNowCompleted = updatedTaskDetails.tasks[0].status === "done";
    }

    // Get task credit info
    const creditInfo = await taskManager.getUserCreditInfo(
      telegramUserId,
      username
    );

    // Format results message
    let resultMessage = `✅ <b>Interaction Check Results for @${username}</b>\n\n`;

    resultMessage += `- <b>Task Status:</b> ${
      isNowCompleted ? "✓ Completed" : "⏳ In Progress"
    }\n`;
    resultMessage += `- <b>Completed Links:</b> ${
      initialCompletedLinks + newlyCompletedLinks
    }/${task.totalLinks}\n`;
    resultMessage += `- <b>New Interactions Detected:</b> ${newlyCompletedLinks}\n`;
    resultMessage += `- <b>Available Credits:</b> ${
      creditInfo?.availableCredits || 0
    }\n\n`;

    if (isNowCompleted && !wasAlreadyCompleted) {
      resultMessage +=
        "🎉 <b>Congratulations!</b> You have completed all required interactions for this task.\n" +
        "You can now post your own links for interactions using /post command.\n\n";
    } else if (isNowCompleted) {
      resultMessage +=
        "✓ <b>Task already completed</b>. You can post your own links using /post command.\n\n";
    } else {
      const remaining =
        task.totalLinks - (initialCompletedLinks + newlyCompletedLinks);
      resultMessage +=
        `⏳ <b>Task in progress</b>. You need to complete ${remaining} more interactions.\n` +
        "Continue interacting with the posts to complete your task.\n\n";
    }

    // Send results
    await ctx.reply(resultMessage, {
      parse_mode: "HTML",
      reply_markup: KEYBOARDS.MAIN,
    });

    // Exit scene
    return ctx.scene.leave();
  } catch (error) {
    logger.error(`Error in checkInteractionsForUsername: ${error}`);
    await ctx.reply(
      `❌ <b>Error</b>\n\nFailed to check interactions: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      {
        parse_mode: "HTML",
        reply_markup: KEYBOARDS.MAIN,
      }
    );
    return ctx.scene.leave();
  }
}

/**
 * Check if a user has interacted with a post
 * @param username X username
 * @param postUrl URL of the post to check
 * @returns True if the user has interacted, false otherwise
 */
async function checkIfInteracted(
  username: string,
  postUrl: string
): Promise<boolean> {
  // For now, we're simulating that all interactions are successful
  // In a real implementation, this would check the actual interactions from X API or another service
  const rd = Math.random();
  return rd < 0.5; // Simulate 50% chance of interaction
}

export default checkSingleUsernameScene;
