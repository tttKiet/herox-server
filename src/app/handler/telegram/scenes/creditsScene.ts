import { Scenes } from "telegraf";
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

// Scene to display user credits
const creditsScene = new Scenes.BaseScene<any>("credits");

// Handler when entering the scene
creditsScene.enter(async (ctx) => {
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
        `❌ You haven't set up your profile. Please use the ${COMMANDS.SETUP} command first.`,
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

    // Check if user has X usernames
    if (
      !userData.registeredUsernames ||
      userData.registeredUsernames.length === 0
    ) {
      await ctx.reply(
        `❌ You haven't set up any X usernames. Please use the ${COMMANDS.SETUP} command to add your usernames first.`,
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

    // Get credits for all usernames directly without showing loading message
    await displayCreditsForAllUsernames(
      ctx,
      telegramId,
      userData.registeredUsernames
    );
  } catch (error) {
    logger.error(`Error fetching user data: ${error}`);
    await ctx.reply(
      `❌ Error retrieving your profile data. Please try again later.`,
      {
        reply_markup: {
          ...KEYBOARDS.MAIN,
          inline_keyboard: NAV_KEYBOARDS.START_MENU.inline_keyboard,
        },
      }
    );
    return ctx.scene.leave();
  }
});

/**
 * Display credits for all usernames of a user
 */
async function displayCreditsForAllUsernames(
  ctx: any,
  telegramUserId: string,
  usernames: string[]
): Promise<void> {
  try {
    // Create task manager
    const taskManager = new TaskManager();

    // Define result type
    interface CreditResult {
      username: string;
      availableCredits: number;
      totalEarnedCredits: number;
      totalUsedCredits: number;
      completedTasks: number;
    }

    // Track results for all usernames
    const results: CreditResult[] = [];
    let totalCredits = 0;
    let totalEarned = 0;
    let totalUsed = 0;
    let totalCompletedTasks = 0;

    // Process each username
    for (const username of usernames) {
      try {
        // Get credit info for this username
        const creditInfo = await taskManager.getUserCreditInfo(
          telegramUserId,
          username
        );

        // Get task info to count completed tasks
        const taskDetails = await taskManager.getCompletedTaskCount(
          telegramUserId,
          username
        );
        const completedTasks = taskDetails?.completedCount || 0;

        if (creditInfo) {
          results.push({
            username,
            availableCredits: creditInfo.availableCredits || 0,
            totalEarnedCredits: creditInfo.totalEarnedCredits || 0,
            totalUsedCredits: creditInfo.totalUsedCredits || 0,
            completedTasks,
          });

          totalCredits += creditInfo.availableCredits || 0;
          totalEarned += creditInfo.totalEarnedCredits || 0;
          totalUsed += creditInfo.totalUsedCredits || 0;
          totalCompletedTasks += completedTasks;
        } else {
          results.push({
            username,
            availableCredits: 0,
            totalEarnedCredits: 0,
            totalUsedCredits: 0,
            completedTasks: 0,
          });
        }
      } catch (error) {
        logger.error(
          `Error getting credit info for ${username}: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }

    // Send summary message
    if (results.length > 0) {
      // Send overall summary first
      await ctx.reply(
        `💰 <b>Credit Summary</b>\n\n` +
          `Total Available Credits: <b>${totalCredits}</b>\n` +
          `Total Earned Credits: ${totalEarned}\n` +
          `Total Used Credits: ${totalUsed}\n` +
          `Completed Tasks: ${totalCompletedTasks}\n\n` +
          `<i>Detailed breakdown by account:</i>`,
        { parse_mode: "HTML" }
      );

      // Send all username details in a single message
      let accountDetailsMessage = `<b>Account Details:</b>\n\n`;

      // Format: Username | Available/Earned
      for (const result of results) {
        const { username, availableCredits, totalEarnedCredits } = result;

        accountDetailsMessage += `${username}: <b>${availableCredits} available</b> / ${totalEarnedCredits} earned\n`;
      }

      await ctx.reply(accountDetailsMessage, { parse_mode: "HTML" });

      // Final message with instructions
      await ctx.reply(
        `📌 <b>How Credits Work</b>\n\n` +
          `• Complete tasks to earn credits\n` +
          `• Each required link in a task earns you 1 credit\n` +
          `• Use credits to post your own links (1 credit per link)\n` +
          `• Credits are tied to specific X accounts\n\n` +
          `Use ${COMMANDS.GET_POSTS} to get more tasks and earn credits.`,
        {
          parse_mode: "HTML",
          reply_markup: KEYBOARDS.MAIN,
        }
      );
    } else {
      await ctx.reply(
        "❌ <b>No credit information available</b>\n\nYou don't have any credits yet. Complete tasks to earn credits.",
        {
          parse_mode: "HTML",
          reply_markup: KEYBOARDS.MAIN,
        }
      );
    }

    // Exit scene
    return ctx.scene.leave();
  } catch (error) {
    logger.error(
      `Error displaying credits: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    await ctx.reply(
      `❌ <b>Error</b>\n\nFailed to get credit information: ${
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

export { creditsScene };
