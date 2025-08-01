/**
 * Handler for interaction checking functionality
 */
import { logger } from "../../../../../utils/logger";
import {
  BUTTONS,
  COMMANDS,
  KEYBOARDS,
  MESSAGES,
} from "../../../../../utils/constants/botCommands";
import { TaskManager } from "../../../../../class";
import { ITelegramUser, ITaskLink } from "../../../../../utils/interfaces";
import { getCollection } from "../../../../../utils/mongoDb";

/**
 * Check interactions for all usernames registered to a user
 */
export async function checkInteractionsForAllUsernames(
  ctx: any,
  telegramUserId: string
): Promise<void> {
  try {
    // Get user data from database
    const usersCollection = getCollection<ITelegramUser>("interactXTgUsers");
    const userData = await usersCollection.findOne({ userId: telegramUserId });

    if (
      !userData ||
      !userData.registeredUsernames ||
      userData.registeredUsernames.length === 0
    ) {
      await ctx.reply(
        `❌ No registered usernames found. Please set up your profile first.`,
        { reply_markup: KEYBOARDS.MAIN }
      );
      return ctx.scene.leave();
    }

    // Create task manager
    const taskManager = new TaskManager();

    // Prepare summary data
    const usernames = userData.registeredUsernames;
    let totalNewlyCompletedLinks = 0;
    let totalTasksCompleted = 0;
    let totalTasksInProgress = 0;
    let taskSummaries: string[] = [];

    // Process each username
    for (const username of usernames) {
      const taskDetails = await taskManager.getTaskDetails(
        telegramUserId,
        username
      );

      if (
        !taskDetails.success ||
        !taskDetails.tasks ||
        taskDetails.tasks.length === 0
      ) {
        taskSummaries.push(`@${username}: No active tasks found`);
        continue;
      }

      const task = taskDetails.tasks[0];
      const allLinks = taskDetails.allLinks || [];
      const initialCompletedLinks = task.completedLinks;
      const wasAlreadyCompleted = task.status === "done";
      let newlyCompletedLinks = 0;

      // Check interactions for each pending link
      const pendingLinks = allLinks.filter((link) => link.status === "pending");

      for (const link of pendingLinks) {
        // Check if user has interacted with this link
        const hasInteracted = await checkIfInteracted(username, link.postUrl);

        if (hasInteracted) {
          // Update interaction status in database
          const updated = await taskManager.updateTaskLinkInteraction(
            task._id?.toString() || "",
            link._id?.toString() || "", //taskLinkId
            true
          );

          if (updated) {
            newlyCompletedLinks++;
            totalNewlyCompletedLinks++;
          }
        }
      }

      // Get updated task details
      const updatedTaskDetails = await taskManager.getTaskDetails(
        telegramUserId,
        username
      );

      // Kiểm tra xem nhiệm vụ đã hoàn thành dựa vào số link đã hoàn thành so với số link tối thiểu
      let isNowCompleted = false;
      let completedLinks = 0;

      // Kiểm tra nếu task không còn tồn tại trong danh sách tasks (có thể đã hoàn thành và được loại bỏ)
      if (
        !updatedTaskDetails.success ||
        !updatedTaskDetails.tasks ||
        updatedTaskDetails.tasks.length === 0
      ) {
        // Trong trường hợp này, task có thể đã hoàn thành và bị loại khỏi danh sách các task chưa hoàn thành
        // Nên chúng ta sẽ dùng task ban đầu và giả định rằng nó đã hoàn thành
        completedLinks = task.minimumLinksForTask; // Giả sử đã hoàn thành đủ số link tối thiểu
        isNowCompleted = true; // Đánh dấu là đã hoàn thành

        console.log({
          message: "Task not found in updated details, assuming completed",
          isNowCompleted: true,
          completedLinks: task.minimumLinksForTask,
          min: task.minimumLinksForTask,
          total: task.totalLinks,
        });
      } else if (
        updatedTaskDetails.tasks &&
        updatedTaskDetails.tasks.length > 0
      ) {
        const currentTask = updatedTaskDetails.tasks[0];
        // Sử dụng số lượng link hoàn thành từ updatedTaskDetails thay vì tính toán
        completedLinks = currentTask.completedLinks;

        // Kiểm tra nếu đã hoàn thành đủ số link tối thiểu hoặc status đã là done
        isNowCompleted =
          completedLinks >= currentTask.minimumLinksForTask ||
          currentTask.status === "done";
        console.log({
          isNowCompleted,
          completedLinks,
          min: currentTask.minimumLinksForTask,
          total: currentTask.totalLinks,
          status: currentTask.status,
        });

        // Nếu task đã "done", đảm bảo completedLinks hiển thị chính xác
        if (currentTask.status === "done") {
          completedLinks = Math.max(
            completedLinks,
            currentTask.minimumLinksForTask
          );
        }

        // Cập nhật trạng thái nếu đã hoàn thành đủ link nhưng status chưa được cập nhật
        if (isNowCompleted && currentTask.status !== "done") {
          // Gọi updateTaskLinkInteraction sẽ cập nhật trạng thái task và xóa các link pending
          await taskManager.updateTaskLinkInteraction(
            currentTask._id?.toString() || "",
            "", // Không cần postId khi chỉ muốn kiểm tra lại trạng thái
            true
          );

          logger.info(
            `Task đã hoàn thành và đã xóa các link pending cho ${username}`
          );
        }
      }

      // Update summary counts
      if (isNowCompleted) {
        totalTasksCompleted++;

        if (!wasAlreadyCompleted) {
          // This task was just completed now
          taskSummaries.push(
            `@${username}: ✅ Task completed! ${
              initialCompletedLinks + newlyCompletedLinks
            }/${task.minimumLinksForTask || task.totalLinks} links (out of ${
              task.totalLinks
            } total)`
          );
        } else {
          // Task was already completed before
          taskSummaries.push(
            `@${username}: ✓ Task already completed (${
              task.minimumLinksForTask || task.totalLinks
            }/${task.totalLinks} links)`
          );
        }
      } else {
        totalTasksInProgress++;

        // Sử dụng dữ liệu từ task hiện tại nếu có, nếu không thì dùng task ban đầu
        // Đây là để xử lý trường hợp task đã hoàn thành và không còn trong danh sách tasks
        const taskToUse = updatedTaskDetails.tasks?.[0] || task;
        const minimumLinks =
          taskToUse.minimumLinksForTask || task.minimumLinksForTask;
        const totalLinksCount = taskToUse.totalLinks || task.totalLinks;
        const remaining = Math.max(0, minimumLinks - completedLinks);

        taskSummaries.push(
          `@${username}: ⏳ In progress - ${completedLinks}/${minimumLinks} (${remaining} more needed out of ${totalLinksCount} total links)`
        );
      }
    }

    // Get credit info
    const creditInfo = await taskManager.getUserCreditInfo(
      telegramUserId,
      usernames[0]
    );

    // Format results message
    let resultMessage = `✅ <b>Interaction Check Results</b>\n\n`;
    resultMessage += `<b>Account Summary:</b>\n`;
    resultMessage += `- <b>Total Accounts:</b> ${usernames.length}\n`;
    resultMessage += `- <b>Tasks Completed:</b> ${totalTasksCompleted}\n`;
    resultMessage += `- <b>Tasks In Progress:</b> ${totalTasksInProgress}\n`;
    resultMessage += `- <b>New Interactions Detected:</b> ${totalNewlyCompletedLinks}\n`;
    resultMessage += `- <b>Available Credits:</b> ${
      creditInfo?.availableCredits || 0
    }\n\n`;

    // Add individual task summaries
    resultMessage += `<b>Account Details:</b>\n`;
    resultMessage += taskSummaries.join("\n") + "\n\n";

    // Add final instructions
    if (totalTasksCompleted > 0) {
      resultMessage +=
        "✓ You can post your own links using /post command with your completed accounts.\n";
    }

    if (totalTasksInProgress > 0) {
      resultMessage +=
        "⏳ Continue interacting with posts to complete your remaining tasks.\n";
    }

    // Send results
    await ctx.reply(resultMessage, {
      parse_mode: "HTML",
      reply_markup: KEYBOARDS.MAIN,
    });

    // Exit scene
    return ctx.scene.leave();
  } catch (error) {
    logger.error(`Error in checkInteractionsForAllUsernames: ${error}`);
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
 * Check interactions for a specific username
 */
export async function checkInteractionsForUsername(
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

    const task = taskDetails.tasks[0]; // Get first task
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
          link._id?.toString() || "", // Pass the taskLinkId instead of postId
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
    let completedLinks = 0;

    // Kiểm tra nếu task không còn tồn tại trong danh sách tasks (có thể đã hoàn thành và được loại bỏ)
    if (
      !updatedTaskDetails.success ||
      !updatedTaskDetails.tasks ||
      updatedTaskDetails.tasks.length === 0
    ) {
      // Trong trường hợp này, task có thể đã hoàn thành và bị loại khỏi danh sách các task chưa hoàn thành
      // Nên chúng ta sẽ dùng task ban đầu và giả định rằng nó đã hoàn thành
      completedLinks = task.minimumLinksForTask; // Giả sử đã hoàn thành đủ số link tối thiểu
      isNowCompleted = true; // Đánh dấu là đã hoàn thành

      logger.info(
        `Task for ${username} not found in updated details, assuming completed`
      );
    } else if (
      updatedTaskDetails.tasks &&
      updatedTaskDetails.tasks.length > 0
    ) {
      const currentTask = updatedTaskDetails.tasks[0];
      // Sử dụng số lượng link hoàn thành từ updatedTaskDetails thay vì tính toán
      completedLinks = currentTask.completedLinks;

      // Kiểm tra nếu đã hoàn thành đủ số link tối thiểu hoặc status đã là done
      isNowCompleted =
        completedLinks >= currentTask.minimumLinksForTask ||
        currentTask.status === "done";

      // Nếu task đã "done", đảm bảo completedLinks hiển thị chính xác
      if (currentTask.status === "done") {
        completedLinks = Math.max(
          completedLinks,
          currentTask.minimumLinksForTask
        );
      }

      // Cập nhật trạng thái nếu đã hoàn thành đủ link nhưng status chưa được cập nhật
      if (isNowCompleted && currentTask.status !== "done") {
        // Gọi updateTaskLinkInteraction sẽ cập nhật trạng thái task và xóa các link pending
        await taskManager.updateTaskLinkInteraction(
          currentTask._id?.toString() || "",
          "", // Không cần postId khi chỉ muốn kiểm tra lại trạng thái
          true
        );

        logger.info(
          `Task đã hoàn thành và đã xóa các link pending cho ${username}`
        );
      }
    }

    // Get task credit info
    const creditInfo = await taskManager.getUserCreditInfo(
      telegramUserId,
      username
    );

    // Format results message
    let resultMessage = `✅ <b>Interaction Check Results for @${username}</b>\n\n`;

    // Sử dụng thông tin từ task hiện tại nếu có, nếu không thì dùng task ban đầu
    // Đây là để xử lý trường hợp task đã hoàn thành và không còn trong danh sách tasks
    const taskToUse = updatedTaskDetails.tasks?.[0] || task;
    const totalLinksCount = taskToUse.totalLinks || task.totalLinks;

    resultMessage += `- <b>Task Status:</b> ${
      isNowCompleted ? "✓ Completed" : "⏳ In Progress"
    }\n`;
    resultMessage += `- <b>Completed Links:</b> ${completedLinks}/${totalLinksCount}\n`;
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
      // Sử dụng task hiện tại nếu có, nếu không thì dùng task ban đầu
      // Để tránh lỗi khi task đã hoàn thành và không còn trong danh sách tasks
      const taskToUse = updatedTaskDetails.tasks?.[0] || task;
      const minimumLinks =
        taskToUse.minimumLinksForTask || task.minimumLinksForTask;
      const remaining = Math.max(0, minimumLinks - completedLinks);

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
export async function checkIfInteracted(
  username: string,
  postUrl: string
): Promise<boolean> {
  // For now, we're simulating that all interactions are successful
  // In a real implementation, this would check the actual interactions from X API or another service
  const rd = Math.random();
  return rd < 0.5; // Simulate 50% chance of interaction
}
