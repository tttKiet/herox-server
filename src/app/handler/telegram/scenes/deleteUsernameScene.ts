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

// Scene for deleting X usernames
const deleteUsernameScene = new Scenes.BaseScene<any>("delete-username");

// Handler when entering the scene
deleteUsernameScene.enter(async (ctx) => {
  try {
    // Initialize interactBot when needed
    const interactBot = new InteractXTgBot();

    // Check user information in the database
    const userXUsernames = await interactBot.getUserXUsernames(
      ctx.from.id.toString()
    );

    // Log using logger instead of console.log
    logger.info(
      `Retrieved ${userXUsernames.length} usernames for user ${ctx.from.id} for deletion`
    );

    if (!userXUsernames || userXUsernames.length === 0) {
      await ctx.reply("❌ You don't have any registered usernames to delete.", {
        reply_markup: KEYBOARDS.MAIN,
      });
      return ctx.scene.leave();
    }

    // Format usernames for display
    const formattedUsernames = userXUsernames
      .map((name, index) => `${name}`)
      .join("\n");

    // Use HTML instead of Markdown to avoid escaping issues
    await ctx.reply(
      "<b>🗑️ Delete Usernames</b>\n\n" +
        "Your current usernames:\n" +
        formattedUsernames +
        "\n\n" +
        "Please enter the usernames you want to delete (one per line).\n" +
        "Example:\n<pre>username1\nusername2</pre>\n\n" +
        `Or send ${COMMANDS.CANCEL} to cancel.`,
      { parse_mode: "HTML" }
    );
  } catch (error) {
    logger.error(`Error retrieving user data for deletion: ${error}`);
    await ctx.reply(
      "❌ An error occurred while retrieving your usernames. Please try again later.",
      {
        reply_markup: KEYBOARDS.MAIN,
      }
    );
    return ctx.scene.leave();
  }
});

// Handler when receiving text messages
deleteUsernameScene.on(message("text"), async (ctx) => {
  const text = ctx.message.text;

  // Check if the message is a cancel command
  if (text.toLowerCase() === COMMANDS.CANCEL) {
    await ctx.reply(MESSAGES.CANCEL_OPERATION);
    return ctx.scene.leave();
  }

  // Check if the user enters other commands or buttons while in delete mode
  if (
    Object.values(COMMANDS).includes(text) ||
    Object.values(BUTTONS).includes(text)
  ) {
    await ctx.reply(MESSAGES.BUSY_IN_SCENE);
    return;
  }

  try {
    // Get user ID from context
    const userId = ctx.from.id.toString();

    // Initialize interactBot
    const interactBot = new InteractXTgBot();

    // Get current usernames
    const currentUsernames = await interactBot.getUserXUsernames(userId);

    if (!currentUsernames || currentUsernames.length === 0) {
      await ctx.reply("❌ You don't have any registered usernames to delete.", {
        reply_markup: KEYBOARDS.MAIN,
      });
      return ctx.scene.leave();
    }

    // Process usernames to delete
    const usernamesToDelete = text
      .split("\n")
      .map((username) => username.trim())
      // Remove empty usernames
      .filter((username) => username)
      // Remove @ at the beginning if present
      .map((username) =>
        username.startsWith("@") ? username.substring(1) : username
      );

    if (usernamesToDelete.length === 0) {
      return ctx.reply(
        "❌ No valid usernames found to delete.\n\n" +
          "Please enter valid usernames (one per line).",
        { parse_mode: "HTML" }
      );
    }

    // Filter out usernames that don't exist in the current list
    const validDeletions = usernamesToDelete.filter((username) =>
      currentUsernames.includes(username)
    );

    const invalidUsernames = usernamesToDelete.filter(
      (username) => !currentUsernames.includes(username)
    );

    if (validDeletions.length === 0) {
      return ctx.reply(
        "❌ None of the usernames you entered are in your registered list.",
        { parse_mode: "HTML" }
      );
    }

    // Calculate new usernames list after deletion
    const newUsernames = currentUsernames.filter(
      (username) => !validDeletions.includes(username)
    );

    // Update user's usernames
    await interactBot.updateUsernames(userId, newUsernames);

    // Format deletion report
    let responseMessage = "<b>✅ Usernames Deleted</b>\n\n";

    if (validDeletions.length > 0) {
      responseMessage +=
        "Successfully deleted:\n" +
        validDeletions.map((name) => `- @${name}`).join("\n") +
        "\n\n";
    }

    if (invalidUsernames.length > 0) {
      responseMessage +=
        "Not found in your list:\n" +
        invalidUsernames.map((name) => `- @${name}`).join("\n") +
        "\n\n";
    }

    responseMessage += `Remaining usernames: ${newUsernames.length}`;

    await ctx.reply(responseMessage, {
      parse_mode: "HTML",
      reply_markup: KEYBOARDS.MAIN,
    });

    logger.info(
      `User ${
        ctx.from.username
      } (${userId}) deleted usernames: ${validDeletions.join(", ")}`
    );

    // Leave the scene
    return ctx.scene.leave();
  } catch (error) {
    logger.error(`Error deleting usernames: ${error}`);
    await ctx.reply(
      "❌ An error occurred while deleting usernames. Please try again later.",
      {
        reply_markup: KEYBOARDS.MAIN,
      }
    );
    return ctx.scene.leave();
  }
});

// Handler when receiving non-text messages
deleteUsernameScene.on(message(), async (ctx) => {
  await ctx.reply(
    "❌ Please send only text messages.\n\n" +
      "Enter the usernames you want to delete, one username per line.\n" +
      `Or send ${COMMANDS.CANCEL} to cancel.`
  );
});

export { deleteUsernameScene };
