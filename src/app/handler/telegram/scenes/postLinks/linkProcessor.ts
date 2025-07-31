import { TaskManager } from "../../../../../class";
import { logger } from "../../../../../utils/logger";
import {
  COMMANDS,
  KEYBOARDS,
} from "../../../../../utils/constants/botCommands";
import { extractUsernameFromLink } from "./linkUtils";

/**
 * Process links submitted by user
 */
export async function processUserLinks(
  ctx: any,
  telegramUserId: string,
  xUsername: string,
  links: string[]
): Promise<void> {
  try {
    // Display loading message
    await ctx.reply(`⏳ Processing ${links.length} links for @${xUsername}...`);

    // Create task manager
    const taskManager = new TaskManager();

    // Validate links format first
    const validLinks = links.filter((link) => {
      const xRegex =
        /https?:\/\/(www\.)?(twitter\.com|x\.com)\/\w+\/status\/\d+/i;
      return xRegex.test(link);
    });

    if (validLinks.length === 0) {
      await ctx.reply(
        `❌ <b>Invalid links</b>\n\n` +
          `None of the provided links are valid Twitter/X post links. Please try again with valid links.`,
        {
          parse_mode: "HTML",
          reply_markup: KEYBOARDS.MAIN,
        }
      );
      return ctx.scene.leave();
    }

    if (validLinks.length < links.length) {
      await ctx.reply(
        `⚠️ <b>Some invalid links detected</b>\n\n` +
          `${
            links.length - validLinks.length
          } of your links were invalid and will be skipped.\n` +
          `Processing ${validLinks.length} valid links...`,
        { parse_mode: "HTML" }
      );
      links = validLinks;
    }

    // Check if links belong to the specified username
    const linksWithUsernames = links.map((link) => ({
      link,
      username: extractUsernameFromLink(link),
    }));

    const invalidUserLinks = linksWithUsernames.filter(
      (item) =>
        item.username && item.username.toLowerCase() !== xUsername.toLowerCase()
    );

    if (invalidUserLinks.length > 0) {
      // Create a message showing the invalid links
      let invalidLinksMessage =
        `❌ <b>Links from other usernames detected</b>\n\n` +
        `The following links do not belong to @${xUsername}:\n\n`;

      invalidUserLinks.forEach((item, index) => {
        if (index < 5) {
          // Show only first 5 invalid links to avoid too long messages
          invalidLinksMessage += `- ${item.link} (from @${item.username})\n`;
        }
      });

      if (invalidUserLinks.length > 5) {
        invalidLinksMessage += `\n...and ${
          invalidUserLinks.length - 5
        } more invalid links.`;
      }

      invalidLinksMessage += `\n\nPlease only submit links from your own username @${xUsername}.`;

      await ctx.reply(invalidLinksMessage, {
        parse_mode: "HTML",
        reply_markup: KEYBOARDS.MAIN,
      });
      return ctx.scene.leave();
    }

    // Filter links to only include those from the correct username
    const userLinks = linksWithUsernames
      .filter(
        (item) =>
          item.username &&
          item.username.toLowerCase() === xUsername.toLowerCase()
      )
      .map((item) => item.link);

    if (userLinks.length === 0) {
      await ctx.reply(
        `❌ <b>No valid links for @${xUsername}</b>\n\n` +
          `None of the provided links belong to @${xUsername}. Please submit only your own links.`,
        {
          parse_mode: "HTML",
          reply_markup: KEYBOARDS.MAIN,
        }
      );
      return ctx.scene.leave();
    }

    if (userLinks.length < links.length) {
      await ctx.reply(
        `⚠️ <b>Some links do not belong to @${xUsername}</b>\n\n` +
          `${
            links.length - userLinks.length
          } of your links were from other usernames and will be skipped.\n` +
          `Processing ${userLinks.length} valid links from @${xUsername}...`,
        { parse_mode: "HTML" }
      );
      links = userLinks;
    }

    // Get user credit info first to check availability
    const creditInfo = await taskManager.getUserCreditInfo(
      telegramUserId,
      xUsername
    );

    if (!creditInfo || creditInfo.availableCredits <= 0) {
      // Check if there's a completed task that hasn't been credited yet
      const taskDetails = await taskManager.getTaskDetails(
        telegramUserId,
        xUsername
      );

      if (
        taskDetails.success &&
        taskDetails.task &&
        taskDetails.task.status === "done"
      ) {
        await ctx.reply(
          `⏳ <b>Processing your completed task</b>\n\n` +
            `We found that you have completed a task but your credits haven't been updated yet. Processing...`,
          { parse_mode: "HTML" }
        );

        // Wait for potential credit update
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Check credits again
        const refreshedCreditInfo = await taskManager.getUserCreditInfo(
          telegramUserId,
          xUsername
        );

        if (!refreshedCreditInfo || refreshedCreditInfo.availableCredits <= 0) {
          await ctx.reply(
            `❌ <b>No credits available</b>\n\n` +
              `You don't have any credits for @${xUsername}. Complete tasks to earn credits.`,
            {
              parse_mode: "HTML",
              reply_markup: KEYBOARDS.MAIN,
            }
          );
          return ctx.scene.leave();
        }
      } else {
        await ctx.reply(
          `❌ <b>No credits available</b>\n\n` +
            `You don't have any credits for @${xUsername}. Complete tasks to earn credits.`,
          {
            parse_mode: "HTML",
            reply_markup: KEYBOARDS.MAIN,
          }
        );
        return ctx.scene.leave();
      }
    }

    // Check if links exceed available credits
    if (links.length > creditInfo.availableCredits) {
      await ctx.reply(
        `⚠️ <b>Too many links</b>\n\n` +
          `You have ${creditInfo.availableCredits} credits but tried to post ${links.length} links.\n` +
          `Only the first ${creditInfo.availableCredits} links will be processed.`,
        { parse_mode: "HTML" }
      );
      links = links.slice(0, creditInfo.availableCredits);
    }

    // Save links to the system and the post database
    const result = await taskManager.saveUserLinks(
      telegramUserId,
      xUsername,
      links
    );

    // Also save to the interactXTgPosts collection using postService
    try {
      const postService = (await import("../../../../../services/postService"))
        .default;
      for (const link of links) {
        // Extract postId from URL
        const postIdMatch = link.match(/\/status\/(\d+)/);
        const postId = postIdMatch ? postIdMatch[1] : null;

        if (postId) {
          await postService.createOrUpdatePost({
            postId,
            postUrl: link,
            username: xUsername,
            interactionCount: 1,
            type: "member",
          });
        }
      }
    } catch (error) {
      logger.warn(
        `Failed to save posts to database: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      // Don't interrupt the flow if this fails
    }

    // Get updated credit info
    const updatedCreditInfo = await taskManager.getUserCreditInfo(
      telegramUserId,
      xUsername
    );
    const remainingCredits = updatedCreditInfo?.availableCredits || 0;

    if (result.success) {
      // Success message with credit information
      await ctx.reply(
        "✅ <b>Links posted successfully!</b>\n\n" +
          `Saved ${links.length} links to the system.\n` +
          "Your links will be distributed to other users for interactions.\n\n" +
          `💰 <b>Remaining credits: ${remainingCredits}</b>\n` +
          "Thank you for using our service!",
        {
          parse_mode: "HTML",
          reply_markup: KEYBOARDS.MAIN,
        }
      );
    } else {
      await ctx.reply(`❌ <b>Error</b>\n\n${result.message}`, {
        parse_mode: "HTML",
        reply_markup: KEYBOARDS.MAIN,
      });
    }

    // Exit scene after processing
    return ctx.scene.leave();
  } catch (error) {
    logger.error(`Error processing user links: ${error}`);
    await ctx.reply(
      `❌ <b>Error</b>\n\nFailed to process your links: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      {
        parse_mode: "HTML",
        reply_markup: KEYBOARDS.MAIN,
      }
    );

    // Exit scene on error
    return ctx.scene.leave();
  }
}

/**
 * Save user links to the system
 */
export async function saveUserLinks(
  ctx: any,
  telegramUserId: string,
  xUsername: string,
  links: string[]
): Promise<void> {
  try {
    // Display loading message
    await ctx.reply("⏳ Processing your links...");

    // Create task manager
    const taskManager = new TaskManager();

    // Verify links belong to the specified username
    const linksWithUsernames = links.map((link) => ({
      link,
      username: extractUsernameFromLink(link),
    }));

    const userLinks = linksWithUsernames
      .filter(
        (item) =>
          item.username &&
          item.username.toLowerCase() === xUsername.toLowerCase()
      )
      .map((item) => item.link);

    if (userLinks.length === 0) {
      await ctx.reply(
        `❌ <b>No valid links for @${xUsername}</b>\n\n` +
          `None of the provided links belong to @${xUsername}. Please submit only your own links.`,
        {
          parse_mode: "HTML",
          reply_markup: KEYBOARDS.MAIN,
        }
      );
      return ctx.scene.leave();
    }

    if (userLinks.length < links.length) {
      await ctx.reply(
        `⚠️ <b>Some links do not belong to @${xUsername}</b>\n\n` +
          `${
            links.length - userLinks.length
          } of your links were from other usernames and will be skipped.\n` +
          `Processing ${userLinks.length} valid links from @${xUsername}...`,
        { parse_mode: "HTML" }
      );
      links = userLinks;
    }

    // Get credit info to ensure user has enough credits
    const creditInfo = await taskManager.getUserCreditInfo(
      telegramUserId,
      xUsername
    );

    if (!creditInfo || creditInfo.availableCredits <= 0) {
      await ctx.reply(
        `❌ <b>No credits available</b>\n\n` +
          `You don't have any credits for @${xUsername}. Complete tasks to earn credits.`,
        {
          parse_mode: "HTML",
          reply_markup: KEYBOARDS.MAIN,
        }
      );
      return ctx.scene.leave();
    }

    // Check if links exceed available credits
    if (links.length > creditInfo.availableCredits) {
      await ctx.reply(
        `⚠️ <b>Too many links</b>\n\n` +
          `You have ${creditInfo.availableCredits} credits but tried to post ${links.length} links.\n` +
          `Only the first ${creditInfo.availableCredits} links will be processed.`,
        { parse_mode: "HTML" }
      );
      links = links.slice(0, creditInfo.availableCredits);
    }

    // Use credit decreasement method to save links
    const result = await taskManager.saveUserLinks(
      telegramUserId,
      xUsername,
      links
    );

    // Also save to the interactXTgPosts collection using postService
    try {
      const postService = (await import("../../../../../services/postService"))
        .default;
      for (const link of links) {
        // Extract postId from URL
        const postIdMatch = link.match(/\/status\/(\d+)/);
        const postId = postIdMatch ? postIdMatch[1] : null;

        if (postId) {
          await postService.createOrUpdatePost({
            postId,
            postUrl: link,
            username: xUsername,
            interactionCount: 1,
            type: "member",
          });
        }
      }
    } catch (error) {
      logger.warn(
        `Failed to save posts to database: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      // Don't interrupt the flow if this fails
    }

    if (!result.success) {
      throw new Error(result.message || "Could not save links");
    }

    // Get updated credit info
    const updatedCreditInfo = await taskManager.getUserCreditInfo(
      telegramUserId,
      xUsername
    );
    const remainingCredits = updatedCreditInfo?.availableCredits || 0;

    // Success message with credit information
    await ctx.reply(
      "✅ <b>Links posted successfully!</b>\n\n" +
        `Saved ${links.length} links to the system.\n` +
        "Your links will be distributed to other users for interactions.\n\n" +
        `💰 <b>Remaining credits: ${remainingCredits}</b>\n` +
        "Thank you for using our service!",
      {
        parse_mode: "HTML",
        reply_markup: KEYBOARDS.MAIN,
      }
    );

    // Exit scene
    return ctx.scene.leave();
  } catch (error) {
    logger.error(`Error saving user links: ${error}`);

    await ctx.reply(
      `❌ <b>Error</b>\n\nFailed to save links: ${
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
 * Automatically process links by finding appropriate username for each link
 * This function checks all available usernames and matches links to the correct ones
 */
export async function autoProcessUserLinks(
  ctx: any,
  telegramUserId: string,
  usernames: string[],
  links: string[]
): Promise<void> {
  try {
    // Display simple loading message
    await ctx.reply(`✅ Detected ${links.length} links. Processing...`);

    // Create task manager
    const taskManager = new TaskManager();

    // Validate links format first
    const validLinks = links.filter((link) => {
      const xRegex =
        /https?:\/\/(www\.)?(twitter\.com|x\.com)\/\w+\/status\/\d+/i;
      return xRegex.test(link);
    });

    if (validLinks.length === 0) {
      await ctx.reply(
        `❌ <b>Invalid links</b>\n\n` +
          `None of the provided links are valid Twitter/X post links. Please try again with valid links.`,
        {
          parse_mode: "HTML",
          reply_markup: KEYBOARDS.MAIN,
        }
      );
      return ctx.scene.leave();
    }

    // Extract usernames from links
    const linksWithUsernames = validLinks.map((link) => ({
      link,
      username: extractUsernameFromLink(link),
    }));

    // Group links by username
    const linksByUsername = new Map<string, string[]>();

    // Map lower case usernames for case-insensitive matching
    const usernamesLower = usernames.map((u) => u.toLowerCase());
    const usernameMap = new Map<string, string>(); // Maps lowercase -> original case
    usernames.forEach((u) => usernameMap.set(u.toLowerCase(), u));

    // Categorize each link
    const userLinks: { link: string; username: string }[] = [];
    const invalidLinks: { link: string; username: string | null }[] = [];

    linksWithUsernames.forEach((item) => {
      if (
        item.username &&
        usernamesLower.includes(item.username.toLowerCase())
      ) {
        // This link belongs to one of the user's usernames
        const originalUsername =
          usernameMap.get(item.username.toLowerCase()) || item.username;
        userLinks.push({ link: item.link, username: originalUsername });

        // Add to group
        if (!linksByUsername.has(originalUsername)) {
          linksByUsername.set(originalUsername, []);
        }
        linksByUsername.get(originalUsername)?.push(item.link);
      } else {
        // This link does not belong to any of user's usernames
        invalidLinks.push(item);
      }
    });

    // Check if no valid links found for any username
    if (userLinks.length === 0) {
      await ctx.reply(
        `❌ <b>No valid links for your usernames</b>\n\n` +
          `None of the provided links belong to your registered usernames: ${usernames.join(
            ", "
          )}.\n` +
          `Please submit only links from your own usernames.`,
        {
          parse_mode: "HTML",
          reply_markup: KEYBOARDS.MAIN,
        }
      );
      return;
    }

    // If there are invalid links, notify the user
    if (invalidLinks.length > 0) {
      let invalidLinksMessage =
        `⚠️ <b>Some links are not from your usernames</b>\n\n` +
        `The following links do not belong to any of your registered usernames and will be skipped:\n\n`;

      invalidLinks.slice(0, 5).forEach((item) => {
        invalidLinksMessage += `- ${item.link} ${
          item.username ? `(from @${item.username})` : ""
        }\n`;
      });

      if (invalidLinks.length > 5) {
        invalidLinksMessage += `\n...and ${
          invalidLinks.length - 5
        } more invalid links.`;
      }

      await ctx.reply(invalidLinksMessage, {
        parse_mode: "HTML",
      });
    }

    // Process each group of links by username
    let totalProcessed = 0;
    let totalSucceeded = 0;
    const results: {
      username: string;
      processed: number;
      success: boolean;
      message?: string;
    }[] = [];

    for (const [username, usernameLinks] of linksByUsername.entries()) {
      try {
        // Get credit info to ensure user has enough credits
        const creditInfo = await taskManager.getUserCreditInfo(
          telegramUserId,
          username
        );

        // Skip if no credits available
        if (!creditInfo || creditInfo.availableCredits <= 0) {
          results.push({
            username,
            processed: 0,
            success: false,
            message: `No credits available for @${username}`,
          });
          // Just record the error, don't send immediate notification
          continue;
        } // Limit links to available credits
        const linksToProcess =
          usernameLinks.length > creditInfo.availableCredits
            ? usernameLinks.slice(0, creditInfo.availableCredits)
            : usernameLinks;

        // Decreasement available credits by links  and save links
        const result = await taskManager.saveUserLinks(
          telegramUserId,
          username,
          linksToProcess
        );

        console.log("result: ", result);
        totalProcessed += linksToProcess.length;
        if (result.success) {
          totalSucceeded += linksToProcess.length;
          results.push({
            username,
            processed: linksToProcess.length,
            success: true,
          });
        } else {
          results.push({
            username,
            processed: 0,
            success: false,
            message: result.message,
          });
        }
      } catch (error) {
        results.push({
          username,
          processed: 0,
          success: false,
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Send simplified summary
    if (totalProcessed > 0) {
      // Simple success message
      let summaryMessage = `✅ <b>${totalSucceeded} links processed successfully</b>\n\n`;

      // Only show successful accounts
      const successAccounts = results.filter((r) => r.success);
      if (successAccounts.length > 0) {
        for (const result of successAccounts) {
          summaryMessage += `✓ @${result.username}: ${result.processed} links saved\n`;
        }
      }

      // No need to show credits for all usernames
      await ctx.reply(summaryMessage, {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "💰 Credits",
                callback_data: COMMANDS.CREDITS.substring(1),
              }, // remove / from command
              {
                text: "👤 Profile",
                callback_data: COMMANDS.PROFILE.substring(1),
              },
            ],
            [{ text: "❌ Close", callback_data: COMMANDS.CANCEL.substring(1) }],
          ],
        },
      });
    } else {
      // Simple error message focusing on accounts without credits
      let errorMessage = `❌ <b>No links were processed</b>\n\n`;

      // Check specifically for accounts with no credits
      const noCreditsAccounts = results
        .filter(
          (r) =>
            !r.success &&
            r.message &&
            r.message.includes("No credits available")
        )
        .map((r) => `@${r.username}`)
        .join(", ");

      if (noCreditsAccounts) {
        errorMessage += `<b>Accounts with no credits:</b> ${noCreditsAccounts}\n`;
      } else {
        errorMessage += `Please check that your links belong to your usernames and you have sufficient credits.`;
      }

      await ctx.reply(errorMessage, {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "💰 Credits",
                callback_data: COMMANDS.CREDITS.substring(1),
              },
              {
                text: "👤 Profile",
                callback_data: COMMANDS.PROFILE.substring(1),
              },
            ],
            [{ text: "❌ Close", callback_data: COMMANDS.CANCEL.substring(1) }],
          ],
        },
      });
    }
  } catch (error) {
    logger.error(`Error auto-processing user links: ${error}`);
    await ctx.reply(
      `❌ <b>Error</b>\n\nFailed to process your links: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      {
        parse_mode: "HTML",
        reply_markup: KEYBOARDS.MAIN,
      }
    );
  }
}
