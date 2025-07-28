import { Scenes } from "telegraf";
import { message } from "telegraf/filters";
import { logger } from "../../../../utils/logger";
import { InteractXTgBot } from "../../../../class";
import {
  BUTTONS,
  COMMANDS,
  KEYBOARDS,
  MESSAGES,
} from "../../../../utils/constants/botCommands";
import { NAV_KEYBOARDS } from "../../../../utils/constants/navKeyboards";

// Scene for user to set up profile and register X usernames
const setupUserScene = new Scenes.BaseScene<any>("setup-user");

// Don't initialize InteractXTgBot instance at global level

// Handler when entering the scene
setupUserScene.enter(async (ctx) => {
  try {
    // Initialize interactBot when needed
    const interactBot = new InteractXTgBot();
    // Check user information in the database
    const userXUsernames = await interactBot.getUserXUsernames(
      ctx.from.id.toString()
    );

    // Log using logger instead of console.log
    logger.info(
      `Retrieved ${userXUsernames.length} usernames for user ${ctx.from.id}`
    );

    // Create the setup profile message
    let profileMessage = "<b>👤 Setup Profile</b>\n\n";

    // Add current profile info if exists
    if (userXUsernames && userXUsernames.length > 0) {
      profileMessage += `<b>Current Profile:</b> You have ${userXUsernames.length} registered username(s).\n\n`;
    }

    // Add instructions
    profileMessage +=
      "Please enter your X usernames, <b>one username per line</b>.\n\n" +
      "Example:\n<i>username1\nusername2\nusername3\n.............</i>\n\n" +
      "<i>Note: Each username must be on a separate line. Do not use '@' symbol.</i>";

    // Send the combined message with Cancel button
    await ctx.reply(profileMessage, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "❌ Cancel", callback_data: "cancel_setup" }],
        ],
      },
    });
  } catch (error) {
    logger.error(`Error retrieving user data: ${error}`);

    // Send just the setup instructions if there was an error getting user data
    await ctx.reply(
      "<b>👤 Setup Profile</b>\n\n" +
        "Please enter your X usernames, <b>one username per line</b>.\n" +
        "Example:\n<pre>username1\nusername2\nusername3</pre>\n\n" +
        "<i>Note: Each username must be on a separate line. Do not use '@' symbol.</i>",
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [{ text: "❌ Cancel", callback_data: "cancel_setup" }],
          ],
        },
      }
    );
  }
});

// Handle the cancel button callback
setupUserScene.action("cancel_setup", async (ctx) => {
  try {
    logger.info(`Cancel button clicked by user ${ctx.from?.id}`);
    await ctx.answerCbQuery("Setup cancelled");
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

// Handler when receiving text messages
setupUserScene.on(message("text"), async (ctx) => {
  const text = ctx.message.text;

  // Check if the message is a cancel command
  if (text.toLowerCase() === COMMANDS.CANCEL) {
    await ctx.reply(`${MESSAGES.CANCEL_OPERATION}\n\n${MESSAGES.WELCOME}`, {
      parse_mode: "HTML",
      reply_markup: NAV_KEYBOARDS.START_MENU,
    });
    return ctx.scene.leave();
  }

  // Check if the user enters other commands or buttons while in setup
  if (
    Object.values(COMMANDS).includes(text) ||
    Object.values(BUTTONS).includes(text)
  ) {
    await ctx.reply(MESSAGES.BUSY_IN_SCENE);
    return;
  }

  // Split and clean the username list
  const usernames = text
    .split("\n")
    .map((username) => username.trim())
    // Remove empty usernames
    .filter((username) => username)
    // Remove @ at the beginning if present
    .map((username) =>
      username.startsWith("@") ? username.substring(1) : username
    )
    // Filter invalid usernames (only keep letters, numbers, underscores)
    .filter((username) => /^[a-zA-Z0-9_]+$/.test(username));

  // Check if there are no valid usernames
  if (usernames.length === 0) {
    return ctx.reply(
      "❌ No valid usernames found.\n\n" +
        "Please re-enter the usernames, <b>one username per line</b>.\n" +
        "Example:\n<pre>username1\nusername2\nusername3</pre>\n\n" +
        "<i>Note: Usernames can only contain letters, numbers, and underscores.</i>",
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [{ text: "❌ Cancel", callback_data: "cancel_setup" }],
          ],
        },
      }
    );
  }

  try {
    // Get user information from Telegram context
    const telegramUserId = ctx.from.id.toString();
    const telegramUsername = ctx.from.username || "unknown";
    const chatId = ctx.chat.id.toString();
    // Log necessary information instead of logging the entire ctx
    logger.info(
      `Processing setup for user: ${telegramUsername} (${telegramUserId})`
    );

    // Use InteractXTgBot to save information to database
    try {
      // Initialize interactBot when needed
      const interactBot = new InteractXTgBot();
      // Register/Update user information
      const registeredUser = await interactBot.registerUser({
        userId: telegramUserId,
        username: telegramUsername,
        chatId: chatId,
        xUsernames: usernames,
      });

      logger.info(
        `Saved profile information for user ${telegramUsername} (${telegramUserId}): ${usernames.join(
          ", "
        )}`
      );

      // Display success message - using HTML instead of Markdown
      const usernamesList = usernames
        .map((name, i) => `${i + 1}. ${name}`)
        .join("\n");

      await ctx.reply(
        `<b>✅ Profile setup successful!</b>\n\n` +
          `Saved ${usernames.length} username(s):\n` +
          usernamesList +
          "\n\n" +
          `You can now use the "${BUTTONS.GET_POSTS}" button or ${COMMANDS.GET_POSTS} command to receive interaction tasks.`,
        {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: NAV_KEYBOARDS.START_MENU.inline_keyboard,
          },
        }
      );
    } catch (error) {
      logger.error(`Error saving user information: ${error}`);
      await ctx.reply(
        "❌ An error occurred while saving information. Please try again later."
      );
    }

    // Leave the scene
    return ctx.scene.leave();
  } catch (error) {
    logger.error(`Error in setupUserScene: ${error}`);
    await ctx.reply("❌ An error occurred. Please try again later.");
    return ctx.scene.leave();
  }
});

// Handler when receiving non-text messages
setupUserScene.on(message(), async (ctx) => {
  await ctx.reply(
    "❌ Please send only text messages.\n\n" +
      "Enter your X usernames, <b>one username per line</b>.\n" +
      "Example:\n<pre>username1\nusername2\nusername3</pre>\n\n" +
      `Or send ${COMMANDS.CANCEL} to cancel.`,
    {
      parse_mode: "HTML",
      reply_markup: NAV_KEYBOARDS.START_MENU,
    }
  );
});

export { setupUserScene };
