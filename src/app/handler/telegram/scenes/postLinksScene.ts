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
import { IUserCredit, ITelegramUser } from "../../../../utils/interfaces";
import { getCollection } from "../../../../utils/mongoDb";

// Scene to post links for interactions
const postLinksScene = new Scenes.BaseScene<any>("post-links");

// Handler for callback queries from inline keyboards
postLinksScene.action(/^(credits|profile|cancel)$/, async (ctx) => {
  const action = ctx.match[1];

  // Remove the inline keyboard
  try {
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
  } catch (err) {
    // Ignore errors if keyboard already removed
  }

  // Handle the command
  switch (action) {
    case "credits":
      await ctx.scene.leave();
      // Directly execute the command instead of entering scene
      return ctx.reply(`Use ${COMMANDS.CREDITS} to check your credits.`, {
        reply_markup: KEYBOARDS.MAIN,
      });
    case "profile":
      await ctx.scene.leave();
      // Directly execute the command instead of entering scene
      return ctx.reply(`Use ${COMMANDS.PROFILE} to view your profile.`, {
        reply_markup: KEYBOARDS.MAIN,
      });
    case "cancel":
    default:
      await ctx.reply(MESSAGES.CANCEL_OPERATION, {
        reply_markup: KEYBOARDS.MAIN,
      });
      return ctx.scene.leave();
  }
});

// Handler when entering the scene
postLinksScene.enter(async (ctx) => {
  const telegramId = ctx.from?.id?.toString();

  // Check if telegramId is available
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
    // Get user data directly from database, including any detected links
    const usersCollection = getCollection<ITelegramUser>("interactXTgUsers");
    const userData = await usersCollection.findOne({ userId: telegramId });

    // Check if the user hasn't set up their profile
    if (
      !userData ||
      !userData.registeredUsernames ||
      userData.registeredUsernames.length === 0
    ) {
      await ctx.reply(
        `❌ You haven't set up your profile. Please use ${COMMANDS.SETUP} command before posting links.`,
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

    // Store user data in session for later use
    ctx.session.userData = {
      telegramId: userData.userId,
      usernames: userData.registeredUsernames,
    };

    // Check if links were detected and stored in the database
    if (userData.detectedLinks && userData.detectedLinks.length > 0) {
      logger.info(
        `Using ${userData.detectedLinks.length} links from database for user ${telegramId}`
      );

      // Process links automatically without asking for username selection
      await autoProcessUserLinks(
        ctx,
        userData.userId,
        userData.registeredUsernames,
        userData.detectedLinks
      );

      // Clear the links from database after processing
      try {
        const usersCollection = getCollection("interactXTgUsers");
        await usersCollection.updateOne(
          { userId: telegramId },
          { $unset: { detectedLinks: "", detectedAt: "" } }
        );
        logger.info(
          `Cleared detected links from database for user ${telegramId}`
        );
      } catch (err) {
        logger.error(`Failed to clear detected links from database: ${err}`);
      }

      return ctx.scene.leave();
    }
    // Fallback to checking message text if no links in session
    else if (
      ctx.message &&
      ctx.message.text &&
      isXPostLinks(ctx.message.text)
    ) {
      const links = extractXLinks(ctx.message.text);

      // Process links automatically without asking for username selection
      await autoProcessUserLinks(
        ctx,
        userData.userId,
        userData.registeredUsernames,
        links
      );
      return ctx.scene.leave();
    }

    // Provide general instruction for posting links
    const usernamesText = userData.registeredUsernames
      .map((u) => `@${u}`)
      .join(", ");

    await ctx.reply(
      `🔗 <b>Post links for interactions</b>\n\n` +
        `Your registered usernames: ${usernamesText}\n\n` +
        `Simply paste your Twitter/X links and the system will automatically:\n` +
        `1️⃣ Match each link to the correct username\n` +
        `2️⃣ Check available credits for each username\n` +
        `3️⃣ Process links that have sufficient credits\n\n` +
        `Please paste your links now or type /cancel to exit.`,
      {
        parse_mode: "HTML",
        reply_markup: {
          keyboard: [[{ text: "❌ Cancel" }]],
          resize_keyboard: true,
        },
      }
    );
  } catch (error) {
    logger.error(`Error in postLinksScene: ${error}`);
    await ctx.reply(
      `❌ Error retrieving your profile data. Please try again later.`,
      {
        reply_markup: KEYBOARDS.MAIN,
      }
    );
    return ctx.scene.leave();
  }
});

// Handler for text messages
postLinksScene.on(message("text"), async (ctx) => {
  const text = ctx.message.text;
  const userData = ctx.session.userData;

  if (!userData) {
    await ctx.reply(
      `❌ Session data is missing. Please restart by typing /post command.`,
      {
        reply_markup: KEYBOARDS.MAIN,
      }
    );
    return ctx.scene.leave();
  }

  // Check for cancel command
  if (text.toLowerCase() === COMMANDS.CANCEL) {
    await ctx.reply(MESSAGES.CANCEL_OPERATION, {
      reply_markup: KEYBOARDS.MAIN,
    });
    return ctx.scene.leave();
  }

  // If waiting for username selection
  if (ctx.session.usernameSelection) {
    if (text === "❌ Cancel") {
      await ctx.reply(MESSAGES.CANCEL_OPERATION, {
        reply_markup: KEYBOARDS.MAIN,
      });
      return ctx.scene.leave();
    }

    // Check if selected username is valid
    if (userData.usernames.includes(text)) {
      ctx.session.usernameSelection = false;
      ctx.session.selectedUsername = text;

      // If the user previously sent links, process them now
      if (ctx.session.pendingLinks && ctx.session.pendingLinks.length > 0) {
        await processUserLinks(
          ctx,
          userData.telegramId,
          text,
          ctx.session.pendingLinks
        );
        return ctx.scene.leave();
      } else {
        await promptForLinks(ctx, userData.telegramId, text);
      }
      return;
    } else {
      await ctx.reply(
        "❌ Invalid username selection. Please select from the options below:",
        {
          reply_markup: {
            keyboard: userData.usernames.map((username: string) => [
              { text: username },
            ]),
            resize_keyboard: true,
          },
        }
      );
      return;
    }
  }

  // Check if text contains X links - direct link posting mode
  if (isXPostLinks(text)) {
    const links = extractXLinks(text);

    // Process links automatically without asking for username selection
    await autoProcessUserLinks(
      ctx,
      userData.telegramId,
      userData.usernames,
      links
    );
    return ctx.scene.leave();
  }

  // If waiting for link input
  if (ctx.session.waitingForLinks && ctx.session.selectedUsername) {
    // Parse and validate links
    const links = text
      .split("\n")
      .map((link) => link.trim())
      .filter(
        (link) =>
          (link && link.includes("twitter.com")) || link.includes("x.com")
      );

    // Check if no valid links found
    if (links.length === 0) {
      return ctx.reply(
        "❌ No valid Twitter/X links found.\n\n" +
          "Please enter your links again, one link per line.\n" +
          "Or send /cancel to cancel."
      );
    }

    await saveUserLinks(
      ctx,
      userData.telegramId,
      ctx.session.selectedUsername,
      links
    );
    return;
  }

  // Check if the message is a command or button in the middle of posting
  if (
    Object.values(COMMANDS).includes(text) ||
    Object.values(BUTTONS).includes(text)
  ) {
    await ctx.reply(MESSAGES.BUSY_IN_SCENE);
    return;
  }

  // Default response for unexpected input
  await ctx.reply(
    "Please select an option from the keyboard or use /cancel to exit.",
    {
      reply_markup: KEYBOARDS.MAIN,
    }
  );
});

// Handler for non-text messages
postLinksScene.on(message(), async (ctx) => {
  await ctx.reply(
    "❌ Please send only text messages containing links.\n\n" +
      "Enter your list of links, one link per line.\n" +
      "Or send /cancel to cancel."
  );
});

/**
 * Check if text contains Twitter/X links
 */
function isXPostLinks(text: string): boolean {
  // Enhanced regex to match X/Twitter links with query parameters
  const xRegex =
    /https?:\/\/(www\.)?(twitter\.com|x\.com)\/\w+\/status\/\d+([?#][^\\s]*)?/i;
  return xRegex.test(text);
}

/**
 * Extract Twitter/X links from text
 */
function extractXLinks(text: string): string[] {
  // Enhanced regex to handle query parameters and fragments in URLs
  const xRegex =
    /https?:\/\/(www\.)?(twitter\.com|x\.com)\/\w+\/status\/\d+([?#][^\\s]*)?/gi;
  const matches = text.match(xRegex);
  return matches ? [...new Set(matches)] : []; // Remove duplicates
}

/**
 * Extract username from X/Twitter link
 */
function extractUsernameFromLink(link: string): string | null {
  // Enhanced regex that handles query parameters and fragments in URLs
  const regex =
    /https?:\/\/(www\.)?(twitter\.com|x\.com)\/([a-zA-Z0-9_]+)\/status\/\d+([?#].*)?/i;
  const match = link.match(regex);
  return match ? match[3] : null;
}

/**
 * Prompt user to enter links
 */
async function promptForLinks(
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
async function promptWithCredits(
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

/**
 * Process links submitted by user
 */
async function processUserLinks(
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

    // Save links to the system
    const result = await taskManager.saveUserLinks(
      telegramUserId,
      xUsername,
      links
    );

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
 * Check task completion and process link posting
 */
async function checkAndProcessLink(
  ctx: any,
  telegramUserId: string,
  xUsername: string
): Promise<void> {
  try {
    // Display loading message
    await ctx.reply(`⏳ Checking completion status for @${xUsername}...`);

    // Create task manager
    const taskManager = new TaskManager();

    // Check if we have links in the message
    if (ctx.message && ctx.message.text && isXPostLinks(ctx.message.text)) {
      const links = extractXLinks(ctx.message.text);
      await processUserLinks(ctx, telegramUserId, xUsername, links);
      return;
    }

    // Otherwise, prompt for links
    await promptForLinks(ctx, telegramUserId, xUsername);
  } catch (error) {
    logger.error(`Error checking task completion: ${error}`);
    await ctx.reply(
      `❌ <b>Error</b>\n\nFailed to check completion status: ${
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
 * Save user links to the system
 */
async function saveUserLinks(
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

    // Save links
    const result = await taskManager.saveUserLinks(
      telegramUserId,
      xUsername,
      links
    );

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
async function autoProcessUserLinks(
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

        // Save links to the system
        const result = await taskManager.saveUserLinks(
          telegramUserId,
          username,
          linksToProcess
        );

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

export default postLinksScene;
