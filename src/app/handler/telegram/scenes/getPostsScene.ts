import { Scenes } from "telegraf";
import { message } from "telegraf/filters";
import { logger } from "../../../../utils/logger";
import * as fsPromises from "fs/promises";
import * as fs from "fs";
import * as path from "path";
import {
  BUTTONS,
  COMMANDS,
  KEYBOARDS,
  MESSAGES,
} from "../../../../utils/constants/botCommands";
import { TaskManager } from "../../../../class";
import { ITask, ITaskLink, ITelegramUser } from "../../../../utils/interfaces";
import { getCollection } from "../../../../utils/mongoDb";

// Scene to get interaction tasks
const getPostsScene = new Scenes.BaseScene<any>("get-posts");

// Handler when entering the scene
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

    // Show loading message
    await ctx.reply(
      `⏳ <b>Creating tasks for all your accounts</b>\n\nPlease wait while we prepare interaction tasks for all your X accounts. This may take a moment...`,
      { parse_mode: "HTML" }
    );

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

/**
 * Create tasks for all usernames of a user and send summary
 */
async function createTasksForAllUsernames(
  ctx: any,
  telegramUserId: string,
  usernames: string[]
): Promise<void> {
  try {
    // Create task manager
    const taskManager = new TaskManager();

    // Define result type
    interface TaskResult {
      username: string;
      task: ITask;
      links: ITaskLink[];
      memberLinks: number;
      adminLinks: number;
      filePath: string;
    }

    // Track results for all usernames
    const results: TaskResult[] = [];
    let totalLinks = 0;
    let successfulTasks = 0;
    let tempDir = "";

    // Process each username
    for (const username of usernames) {
      try {
        // Check if user already has an active task
        const existingTaskDetails = await taskManager.getTaskDetails(
          telegramUserId,
          username
        );

        console.log("existingTaskDetails | username", {
          existingTaskDetails,
          username,
        });

        // If user has a completed task, we should create a new one
        const shouldCreateNewTask =
          !existingTaskDetails.success ||
          !existingTaskDetails.task ||
          existingTaskDetails.task.status === "done";

        // Create new task only if needed, otherwise use existing task
        const taskResult = shouldCreateNewTask
          ? await taskManager.createTask(telegramUserId, username)
          : existingTaskDetails;

        if (taskResult.success && taskResult.task) {
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

          const { task, links } = taskResult;

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
          const memberLinks = links.filter(
            (link) => link.type === "member"
          ).length;
          const adminLinks = links.filter(
            (link) => link.type === "admin"
          ).length;

          // Add to results
          results.push({
            username,
            task,
            links,
            memberLinks,
            adminLinks,
            filePath,
          });

          totalLinks += links.length;
          successfulTasks++;
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
        `✅ <b>Tasks created successfully</b>\n\n` +
          `Created tasks for ${successfulTasks} out of ${usernames.length} accounts\n` +
          `Total links to interact with: ${totalLinks}\n` +
          `💰 <b>Your available credits: ${totalCredits}</b>\n\n` +
          `Sending individual task details...`,
        { parse_mode: "HTML" }
      );

      // Send individual task details
      for (const result of results) {
        const { username, task, links, memberLinks, adminLinks, filePath } =
          result;

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
                task.status === "done" ? "✅ Completed" : "⏳ In progress"
              }\n` +
              `🔗 Total Links: ${links.length} (${task.minimumLinksForTask}/${task.totalLinks} required)\n` +
              `✅ Completed: ${task.completedLinks}/${task.minimumLinksForTask}\n\n` +
              `💰 Credits: Task completion will earn you ${task.minimumLinksForTask} credits
            
            `,
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
          `- Complete tasks to earn credits (1 credit per required link)\n` +
          `- Use credits to post your own links (1 credit per link)\n` +
          `- Your current credits: ${totalCredits}\n\n` +
          `Good luck!`,
        {
          parse_mode: "HTML",
          reply_markup: KEYBOARDS.AFTER_GET_POSTS,
        }
      );
    } else {
      await ctx.reply(
        "❌ <b>No tasks available</b>\n\nCouldn't create tasks for any of your accounts. Please try again later.",
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
      `Error creating tasks: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    await ctx.reply(
      `❌ <b>Error</b>\n\nFailed to create tasks: ${
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
 * Generate the content for the task file
 */
function generateTaskFileContent(
  username: string,
  taskNumber: number,
  links: ITaskLink[],
  minimumLinksForTask?: number
): string {
  let content = ``;
  links.forEach((link, index) => {
    content += `${link.postUrl}\n`;
  });

  return content;
}

export default getPostsScene;
