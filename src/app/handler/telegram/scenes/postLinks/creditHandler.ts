import { TaskManager } from "../../../../../class";
import { logger } from "../../../../../utils/logger";
import { KEYBOARDS } from "../../../../../utils/constants/botCommands";

/**
 * Prompt user to enter links with credit information
 */
export async function promptForLinks(
  ctx: any,
  telegramUserId: string,
  xUsername: string
): Promise<void> {
  try {
    // Create task manager
    const taskManager = new TaskManager();

    // Get user credit info from database
    const creditInfo = await taskManager.getUserCreditInfo(
      telegramUserId,
      xUsername
    );

    // Check if user has any available credits
    const availableCredits = creditInfo?.availableCredits || 0;

    if (availableCredits <= 0) {
      // If no credits, check if there's a completed task that hasn't been credited yet
      const taskDetails = await taskManager.getTaskDetails(
        telegramUserId,
        xUsername
      );

      if (
        taskDetails.success &&
        taskDetails.task &&
        taskDetails.task.status === "done"
      ) {
        // Task is completed but no credits, let system update the credits
        await ctx.reply(
          `⏳ <b>Processing your completed task</b>\n\n` +
            `We found that you have completed a task but your credits haven't been updated yet. Processing...`,
          { parse_mode: "HTML" }
        );

        // Try to update credits
        if (taskDetails.task._id) {
          try {
            // This should trigger credit update in the system
            const updatedCreditInfo = await taskManager.getUserCreditInfo(
              telegramUserId,
              xUsername
            );
            if (updatedCreditInfo.availableCredits > 0) {
              // Continue with updated credits
              return promptWithCredits(
                ctx,
                xUsername,
                updatedCreditInfo.availableCredits
              );
            }
          } catch (error) {
            logger.error(`Error updating credits: ${error}`);
          }
        }
      }

      // If still no credits, inform user
      await ctx.reply(
        `❌ <b>No credits available</b>\n\n` +
          `You don't have any credits for @${xUsername}. Complete tasks first to earn credits.`,
        {
          parse_mode: "HTML",
          reply_markup: KEYBOARDS.MAIN,
        }
      );
      return ctx.scene.leave();
    }

    // If user has credits, continue with normal flow
    return promptWithCredits(ctx, xUsername, availableCredits);
  } catch (error) {
    logger.error(`Error preparing for link posting: ${error}`);
    await ctx.reply(
      `❌ <b>Error</b>\n\nFailed to prepare for link posting: ${
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
 * Display prompt with credit information
 */
export async function promptWithCredits(
  ctx: any,
  xUsername: string,
  availableCredits: number
): Promise<void> {
  // Mark session as waiting for links
  ctx.session.waitingForLinks = true;
  ctx.session.selectedUsername = xUsername;

  // Provide instructions for posting links with credit information
  await ctx.reply(
    `🔗 <b>Post links for interactions</b>\n\n` +
      `💰 <b>Your available credits: ${availableCredits}</b>\n` +
      `You can post up to ${availableCredits} links.\n\n` +
      `Please enter your tweet links, one link per line.\n` +
      `Example:\nhttps://twitter.com/username/status/1234567890\nhttps://twitter.com/username/status/0987654321\n\n` +
      `Or send /cancel to cancel.`,
    { parse_mode: "HTML" }
  );
}
