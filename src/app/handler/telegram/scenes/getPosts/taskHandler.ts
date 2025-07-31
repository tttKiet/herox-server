/**
 * Task handler functions for getPosts scene
 */

import * as fs from "fs";
import * as path from "path";
import * as fsPromises from "fs/promises";
import { TaskManager } from "../../../../../class";
import { logger } from "../../../../../utils/logger";
import { ITask, ITaskLink } from "../../../../../utils/interfaces";
import { COMMANDS, MESSAGES } from "../../../../../utils/constants/botCommands";
import { NAV_KEYBOARDS } from "../../../../../utils/constants/navKeyboards";
import { generateTaskFileContent } from "./taskUtils";

/**
 * Interface cho kết quả task
 */
interface TaskResult {
  username: string;
  task: ITask;
  links: ITaskLink[];
  memberLinks: number;
  adminLinks: number;
  filePath: string;
}

/**
 * Helper function to process a task and add it to results
 */
async function processTaskAndAddToResults(
  task: ITask,
  links: ITaskLink[],
  username: string,
  tempDir: string,
  telegramUserId: string,
  results: TaskResult[]
): Promise<{ tempDir: string }> {
  // Create temporary directory for files if needed
  if (!tempDir) {
    tempDir = path.join(
      process.cwd(),
      "tmp",
      "tasks",
      telegramUserId.toString()
    );
    await fsPromises.mkdir(tempDir, { recursive: true });
  }

  // Generate task file
  const fileContent = generateTaskFileContent(
    username,
    task.taskNumber,
    links,
    task.minimumLinksForTask
  );
  const filePath = path.join(
    tempDir,
    `${username}_task_${task.taskNumber}.txt`
  );

  // Save file
  await fsPromises.writeFile(filePath, fileContent, "utf8");

  // Count member and admin links
  const memberLinks = links.filter((link) => link.type === "member").length;
  const adminLinks = links.filter((link) => link.type === "admin").length;

  // Add to results
  results.push({
    username,
    task,
    links,
    memberLinks,
    adminLinks,
    filePath,
  });

  return { tempDir };
}

/**
 * Create tasks for all usernames of a user and send summary
 */
export async function createTasksForAllUsernames(
  ctx: any,
  telegramUserId: string,
  usernames: string[]
): Promise<void> {
  try {
    // Create task manager
    const taskManager = new TaskManager();

    // Track results for all usernames
    const results: TaskResult[] = [];
    let totalLinks = 0;
    let successfulTasks = 0;
    let tempDir = "";

    // Process each username
    for (const username of usernames) {
      try {
        // Check if user already has active tasks
        const existingTaskDetails = await taskManager.getTaskDetails(
          telegramUserId,
          username
        );

        // If there are no tasks or all tasks are completed, we should create a new one
        const shouldCreateNewTask =
          !existingTaskDetails.success ||
          !existingTaskDetails.tasks ||
          existingTaskDetails.tasks.length === 0 ||
          existingTaskDetails.tasks.every((task) => task.status === "done");

        if (shouldCreateNewTask) {
          // Create a new task
          const taskResult = await taskManager.createTask(
            telegramUserId,
            username
          );

          if (taskResult.success && taskResult.task) {
            // Process this task
            const result = await processTaskAndAddToResults(
              taskResult.task,
              taskResult.links,
              username,
              tempDir,
              telegramUserId,
              results
            );

            tempDir = result.tempDir;
            totalLinks += taskResult.links.length;
            successfulTasks++;
          } else {
            // Send error message for this specific username
            await ctx.reply(
              `⚠️ <b>Unable to create task for @${username}</b>\n\n${
                taskResult.message ||
                "No suitable links available at this time."
              }`,
              { parse_mode: "HTML" }
            );
          }
        } else {
          // Process each uncompleted task
          for (const task of existingTaskDetails.tasks.filter(
            (t) => t.status === "todo"
          )) {
            if (task._id) {
              // Filter links for this specific task
              const taskLinks = existingTaskDetails.allLinks.filter(
                (link) => link.taskId.toString() === task._id?.toString()
              );

              // Process this task
              const result = await processTaskAndAddToResults(
                task,
                taskLinks,
                username,
                tempDir,
                telegramUserId,
                results
              );

              tempDir = result.tempDir;
              totalLinks += taskLinks.length;
              successfulTasks++;
            }
          }
        }
      } catch (error) {
        logger.error(
          `Error creating task for ${username}: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }

    // Send summary message
    await sendTaskSummary(
      ctx,
      results,
      usernames.length,
      totalLinks,
      telegramUserId,
      successfulTasks
    );

    // Exit scene
    return ctx.scene.leave();
  } catch (error) {
    logger.error(
      `Error creating tasks: ${
        error instanceof Error ? error.message : String(error)
      }`
    );

    await ctx.reply(
      `❌ <b>Error Occurred</b>\n\n` +
        `We encountered a problem while creating your tasks. Please try again later.\n\n` +
        `Error details: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      {
        parse_mode: "HTML",
        reply_markup: require("../../../../../utils/constants/botCommands")
          .KEYBOARDS.MAIN,
      }
    );
    return ctx.scene.leave();
  }
}

/**
 * Send task summary to the user
 */
async function sendTaskSummary(
  ctx: any,
  results: TaskResult[],
  totalUsernames: number,
  totalLinks: number,
  telegramUserId: string,
  successfulTasks: number
): Promise<void> {
  if (results.length > 0) {
    // Get credit info for all usernames
    let totalCredits = 0;
    const taskManager = new TaskManager();

    for (const result of results) {
      const { username } = result;
      try {
        const creditInfo = await taskManager.getUserCreditInfo(
          telegramUserId,
          username
        );
        if (creditInfo) {
          totalCredits += creditInfo.availableCredits || 0;
        }
      } catch (error) {
        logger.warn(`Could not get credit info for ${username}: ${error}`);
      }
    }

    // Send overall summary first with credit information
    await ctx.reply(
      `✅ <b>Tasks Summary</b>\n\n` +
        `Successfully created tasks for ${successfulTasks} out of ${totalUsernames} accounts\n` +
        `Total links to interact with: ${totalLinks}\n` +
        `💰 <b>Your available credits: ${totalCredits}</b>\n\n` +
        `${
          successfulTasks < totalUsernames
            ? `⚠️ Note: Tasks could not be created for some accounts due to insufficient suitable links.`
            : `Sending individual task details...`
        }`,
      { parse_mode: "HTML" }
    );

    // Send individual task details
    for (const result of results) {
      const { username, task, links, filePath } = result;

      // Send file to user
      await ctx.replyWithDocument(
        {
          source: fs.createReadStream(filePath),
          filename: `${username}_task_${task.taskNumber}.txt`,
        },
        {
          caption:
            `@${username}\n\n` +
            `Task #${task.taskNumber}\n` +
            `📊 Status: ${
              task.status === "done" ? "✅ Completed" : "⏳ In Progress"
            }\n` +
            `🔗 Total Links: ${links.length} (${task.minimumLinksForTask} minimum required)\n` +
            `✅ Completed: ${task.completedLinks}/${task.minimumLinksForTask}\n\n`,
        }
      );

      // Clean up file after sending
      try {
        await fsPromises.unlink(filePath);
      } catch (error) {
        logger.warn(`Could not delete temporary file: ${error}`);
      }
    }

    // Final instructions with credit information
    await ctx.reply(
      `📌 <b>Instructions</b>\n\n` +
        `1. Comment on all links in each task to complete them\n` +
        `2. Use ${COMMANDS.CHECK} to verify your progress\n` +
        `3. Once completed, use ${COMMANDS.POST} to post your own links\n\n` +
        `💰 <b>Credit System</b>\n` +
        `- Complete tasks to earn credits (1 credit per required task)\n` +
        `- Use credits to post your own links (1 credit per link)\n` +
        `- Your current credits: ${totalCredits}\n\n` +
        `Good luck with your tasks!`,
      {
        parse_mode: "HTML",
        reply_markup: NAV_KEYBOARDS.START_MENU,
      }
    );
  } else {
    await ctx.reply(
      `❌ <b>No Tasks Available</b>\n\n` +
        `We couldn't create tasks for any of your accounts at this time.\n\n` +
        `Possible reasons:\n` +
        `- Not enough suitable links available in the system\n` +
        `- Your accounts may have already interacted with all available links\n` +
        `- System is waiting for new links to be added\n\n` +
        `Please try again later or consider posting your own links first.`,
      {
        parse_mode: "HTML",
        reply_markup: NAV_KEYBOARDS.START_MENU,
      }
    );
  }
}
