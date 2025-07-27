import { Composer, Scenes } from "telegraf";
import { logger } from "../../../../utils/logger";
import { message } from "telegraf/filters";
import { KEYBOARDS, MESSAGES } from "../../../../utils/constants/botCommands";
import { InteractXTgBot } from "../../../../class";

// Admin password - this should be moved to environment variables in a real application
const ADMIN_PASSWORD = "hero_nimor";

// Create scene for admin post
const adminPostScene = new Scenes.BaseScene<any>("admin-post");

// Handler for entering the scene
adminPostScene.enter(async (ctx) => {
  // Record the admin entry attempt
  const userId = ctx.from?.id;
  const username = ctx.from?.username;
  logger.info(`Admin authentication attempt by ${username} (${userId})`);

  ctx.reply("🔒 <b>Admin Authentication</b>\n\nPlease enter your password.", {
    parse_mode: "HTML",
  });
});

// Handle password check
adminPostScene.on(message("text"), async (ctx) => {
  const password = ctx.message.text;

  // Check if user has already been authenticated in this session
  if (ctx.session.adminAuthenticated) {
    // Process the links
    return await processAdminLinks(ctx);
  }

  // Check password
  if (password === ADMIN_PASSWORD) {
    ctx.session.adminAuthenticated = true;
    logger.success(
      `Admin authenticated: ${ctx.from?.username} (${ctx.from?.id})`
    );

    ctx.reply(
      "🔓 <b>Admin Authentication Successful</b>\n\n" +
        "You are now in admin mode. Please paste your list of X links to add them as admin posts.",
      { parse_mode: "HTML" }
    );
  } else {
    // Failed authentication attempt
    logger.warn(
      `Failed admin authentication by ${ctx.from?.username} (${ctx.from?.id})`
    );
    await ctx.reply("⚠️ Authentication failed. Returning to normal mode.");
    return await ctx.scene.leave();
  }
});

// Handler for exiting the scene
adminPostScene.command("cancel", async (ctx) => {
  await ctx.reply(MESSAGES.CANCEL_OPERATION, {
    reply_markup: KEYBOARDS.MAIN,
  });
  return ctx.scene.leave();
});

/**
 * Process admin links
 */
async function processAdminLinks(ctx: any): Promise<void> {
  try {
    const text = ctx.message.text;
    const links = parseLinks(text);

    if (links.length === 0) {
      await ctx.reply("No valid X links detected. Please paste valid links.");
      return;
    }

    // Add links to database as admin posts
    const bot = new InteractXTgBot();
    const result = await bot.addAdminPosts(links);

    if (result.success) {
      await ctx.reply(
        `✅ <b>Success!</b>\n\n${result.count} admin posts have been added to the system for interaction tasks.`,
        { parse_mode: "HTML" }
      );
    } else {
      await ctx.reply(`⚠️ <b>Error</b>\n\n${result.error}`, {
        parse_mode: "HTML",
      });
    }

    // Exit the scene
    await ctx.reply("Returning to normal mode.", {
      reply_markup: KEYBOARDS.MAIN,
    });
    return ctx.scene.leave();
  } catch (error) {
    logger.error(`Error processing admin links: ${error}`);
    await ctx.reply("An error occurred while processing your links.");
    return ctx.scene.leave();
  }
}

/**
 * Parse X links from text
 */
function parseLinks(text: string): string[] {
  // Regular expression to match X/Twitter links
  const xRegex = /https?:\/\/(www\.)?(twitter\.com|x\.com)\/\w+\/status\/\d+/gi;

  // Extract all links
  const matches = text.match(xRegex) || [];

  // Return unique links
  return [...new Set(matches)];
}

export default adminPostScene;
