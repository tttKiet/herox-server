// import { Scenes } from "telegraf";
// import { message } from "telegraf/filters";
// import { logger } from "../../../../utils/logger";
// import {
//   BUTTONS,
//   COMMANDS,
//   KEYBOARDS,
//   MESSAGES,
// } from "../../../../utils/constants/botCommands";
// import { TaskManager } from "../../../../class";
// import { ITelegramUser, ITaskLink } from "../../../../utils/interfaces";
// import { getCollection } from "../../../../utils/mongoDb";

// // Scene to check interaction status
// const checkInteractionScene = new Scenes.BaseScene<any>("check-interaction");

// // Handler when entering the scene
// checkInteractionScene.enter(async (ctx) => {
//   const telegramId = ctx.from?.id?.toString();

//   // Check if user's ID is available
//   if (!telegramId) {
//     await ctx.reply(
//       `❌ Could not identify your account. Please try again or contact support.`,
//       {
//         reply_markup: {
//           keyboard: [
//             [{ text: BUTTONS.SETUP_PROFILE }],
//             [{ text: BUTTONS.HELP }],
//           ],
//           resize_keyboard: true,
//         },
//       }
//     );
//     return ctx.scene.leave();
//   }

//   try {
//     // Get user data directly from database
//     const usersCollection = getCollection<ITelegramUser>("interactXTgUsers");
//     const userData = await usersCollection.findOne({ userId: telegramId });

//     // Check if user hasn't set up profile
//     if (!userData) {
//       await ctx.reply(
//         `❌ You haven't set up your profile. Please use the ${COMMANDS.SETUP} command before checking tasks.`,
//         {
//           reply_markup: {
//             keyboard: [
//               [{ text: BUTTONS.SETUP_PROFILE }],
//               [{ text: BUTTONS.HELP }],
//             ],
//             resize_keyboard: true,
//           },
//         }
//       );
//       return ctx.scene.leave();
//     }

//     // Check if user has set up X usernames
//     if (
//       !userData.registeredUsernames ||
//       userData.registeredUsernames.length === 0
//     ) {
//       await ctx.reply(
//         `❌ You haven't set up any X usernames. Please use the ${COMMANDS.SETUP} command to add your usernames before checking tasks.`,
//         {
//           reply_markup: {
//             keyboard: [
//               [{ text: BUTTONS.SETUP_PROFILE }],
//               [{ text: BUTTONS.HELP }],
//             ],
//             resize_keyboard: true,
//           },
//         }
//       );
//       return ctx.scene.leave();
//     }

//     // Show loading message
//     await ctx.reply(
//       `⏳ <b>Checking interactions for all your accounts</b>\n\nPlease wait while we verify your interactions across all your X accounts. This may take a moment...`,
//       { parse_mode: "HTML" }
//     );

//     // Check interactions for all usernames
//     await checkInteractionsForAllUsernames(
//       ctx,
//       userData.userId,
//       userData.registeredUsernames
//     );
//   } catch (error) {
//     logger.error(`Error fetching user data: ${error}`);
//     await ctx.reply(
//       `❌ Error retrieving your profile data. Please try again later.`,
//       {
//         reply_markup: KEYBOARDS.MAIN,
//       }
//     );
//     return ctx.scene.leave();
//   }
// });

// // Handle text messages
// checkInteractionScene.on(message("text"), async (ctx) => {
//   const text = ctx.message.text;

//   // Just handle cancel for now since we auto-check all usernames
//   if (text === "❌ Cancel") {
//     await ctx.reply(MESSAGES.CANCEL_OPERATION, {
//       reply_markup: KEYBOARDS.MAIN,
//     });
//     return ctx.scene.leave();
//   }

//   // All other messages
//   await ctx.reply(
//     "Please wait while we check your interactions or use /cancel to exit.",
//     {
//       reply_markup: KEYBOARDS.MAIN,
//     }
//   );
// });

// /**
//  * Check if a user has interacted with a post
//  * @param username X username
//  * @param postUrl URL of the post to check
//  * @returns True if the user has interacted, false otherwise
//  */
// async function checkIfInteracted(
//   username: string,
//   postUrl: string
// ): Promise<boolean> {
//   // For now, we're simulating that all interactions are successful
//   // In a real implementation, this would check the actual interactions from X API or another service
//   const rd = Math.random();
//   return rd < 0.5; // Simulate 50% chance of interaction
// }

// /**
//  * Check interactions for all usernames of a user
//  */
// async function checkInteractionsForAllUsernames(
//   ctx: any,
//   telegramUserId: string,
//   usernames: string[]
// ): Promise<void> {
//   try {
//     // Create task manager
//     const taskManager = new TaskManager();

//     // Track results
//     interface UsernameResults {
//       username: string;
//       task: any;
//       initialCompletedLinks: number;
//       newlyCompletedLinks: number;
//       wasAlreadyCompleted: boolean;
//       isNowCompleted: boolean;
//     }

//     const results: UsernameResults[] = [];
//     let totalNewCompletedLinks = 0;
//     let tasksCompletedDuringCheck = 0;

//     // Process each username
//     for (const username of usernames) {
//       try {
//         logger.info(`Checking interactions for username: ${username}`);

//         // Get initial task details
//         const taskDetails = await taskManager.getTaskDetails(
//           telegramUserId,
//           username
//         );

//         if (
//           !taskDetails.success ||
//           !taskDetails.tasks ||
//           taskDetails.tasks.length === 0
//         ) {
//           logger.warn(`No active task found for @${username}`);
//           continue;
//         }

//         // Lấy task đầu tiên trong danh sách và các links
//         const task = taskDetails.tasks[0];
//         const links = taskDetails.allLinks;
//         const initialCompletedLinks = task.completedLinks;
//         const wasAlreadyCompleted = task.status === "done";
//         let newlyCompletedLinks = 0;

//         // Check interactions for each pending link
//         const pendingLinks = links.filter((link) => link.status === "pending");

//         for (const link of pendingLinks) {
//           // Check if user has interacted with this link
//           const hasInteracted = await checkIfInteracted(username, link.postUrl);

//           if (hasInteracted) {
//             // Update interaction status in database
//             const updated = await taskManager.updateTaskLinkInteraction(
//               task._id?.toString() || "",
//               link.postId,
//               true
//             );

//             if (updated) {
//               newlyCompletedLinks++;
//               totalNewCompletedLinks++;
//               logger.info(
//                 `Interaction verified for @${username} with post ${link.postId}`
//               );
//             }
//           }
//         }

//         // Get updated task details to check if it's now completed
//         const updatedTaskDetails = await taskManager.getTaskDetails(
//           telegramUserId,
//           username
//         );

//         const isNowCompleted =
//           updatedTaskDetails.success &&
//           updatedTaskDetails.tasks &&
//           updatedTaskDetails.tasks.length > 0 &&
//           updatedTaskDetails.tasks[0].status === "done"
//             ? true
//             : false;

//         // Sai logic nhưng không đáng kể
//         if (!wasAlreadyCompleted && isNowCompleted) {
//           tasksCompletedDuringCheck++;
//         }

//         // Add to results
//         results.push({
//           username,
//           task,
//           initialCompletedLinks,
//           newlyCompletedLinks,
//           wasAlreadyCompleted,
//           isNowCompleted,
//         });
//       } catch (error) {
//         logger.error(
//           `Error checking interactions for ${username}: ${
//             error instanceof Error ? error.message : String(error)
//           }`
//         );
//       }
//     }

//     // Send summary message
//     if (results.length > 0) {
//       // Send overall summary first
//       await ctx.reply(
//         `✅ <b>Interaction check completed</b>\n\n` +
//           `Checked ${results.length} accounts\n` +
//           `Found ${totalNewCompletedLinks} new interactions\n` +
//           `${tasksCompletedDuringCheck} tasks were completed during this check\n\n` +
//           `Sending individual account details...`,
//         { parse_mode: "HTML" }
//       );

//       // Send all account details in a single message
//       let accountDetailsMessage = `📊 <b>Account Status:</b>\n\n`;

//       // Process each result and add to the message
//       for (const result of results) {
//         const {
//           username,
//           task, // task still comes from the results array which we populated manually
//           initialCompletedLinks,
//           newlyCompletedLinks,
//           isNowCompleted,
//         } = result;

//         // Calculate percentage of completion
//         const totalCompletedLinks = initialCompletedLinks + newlyCompletedLinks;

//         const completionPercentage = Math.floor(
//           (totalCompletedLinks / task.minimumLinksForTask) * 100
//         );

//         if (completionPercentage >= 100) {
//           accountDetailsMessage += `✅ <b>${username}</b>: ${totalCompletedLinks}/${task.minimumLinksForTask} (${completionPercentage}%) - Done\n`;
//         } else {
//           accountDetailsMessage += `⏳ <b>${username}</b>: ${totalCompletedLinks}/${task.minimumLinksForTask} (${completionPercentage}%) - To do\n`;
//         }
//       }

//       // Send the combined message
//       await ctx.reply(accountDetailsMessage, { parse_mode: "HTML" });

//       // Get credit info for all usernames
//       const taskManager = new TaskManager();
//       let totalCredits = 0;

//       for (const result of results) {
//         const { username } = result;
//         try {
//           const creditInfo = await taskManager.getUserCreditInfo(
//             telegramUserId,
//             username
//           );
//           if (creditInfo) {
//             totalCredits += creditInfo.availableCredits || 0;
//           }
//         } catch (error) {
//           logger.warn(`Could not get credit info for ${username}: ${error}`);
//         }
//       }

//       // Final instructions with credit information
//       await ctx.reply(
//         `📌 <b>What's next?</b>\n\n` +
//           `${
//             tasksCompletedDuringCheck > 0
//               ? "✓ You've completed tasks! Use /post to submit your links.\n"
//               : "✓ Continue interacting with posts to complete your tasks.\n"
//           }` +
//           `✓ Use /get to receive more tasks if needed.\n` +
//           `✓ Use /check anytime to verify your progress again.\n\n` +
//           `💰 <b>Your available credits: ${totalCredits}</b>\n` +
//           `You can post up to ${totalCredits} links.`,
//         {
//           parse_mode: "HTML",
//           reply_markup:
//             tasksCompletedDuringCheck > 0
//               ? KEYBOARDS.AFTER_CHECK
//               : KEYBOARDS.MAIN,
//         }
//       );
//     } else {
//       await ctx.reply(
//         "❌ <b>No active tasks found</b>\n\nYou don't have any active tasks to check. Use /get to get new tasks.",
//         {
//           parse_mode: "HTML",
//           reply_markup: KEYBOARDS.MAIN,
//         }
//       );
//     }

//     // Exit scene
//     return ctx.scene.leave();
//   } catch (error) {
//     logger.error(
//       `Error checking interactions: ${
//         error instanceof Error ? error.message : String(error)
//       }`
//     );
//     await ctx.reply(
//       `❌ <b>Error</b>\n\nFailed to check interactions: ${
//         error instanceof Error ? error.message : "Unknown error"
//       }`,
//       {
//         parse_mode: "HTML",
//         reply_markup: KEYBOARDS.MAIN,
//       }
//     );
//     return ctx.scene.leave();
//   }
// }

// /**
//  * Check task status for a specific username
//  */
// async function checkTaskForUsername(
//   ctx: any,
//   telegramUserId: string,
//   xUsername: string
// ): Promise<void> {
//   // This function is no longer used, but kept for reference
//   // We're now using checkInteractionsForAllUsernames instead
//   await checkInteractionsForAllUsernames(ctx, telegramUserId, [xUsername]);
// }

// export default checkInteractionScene;
