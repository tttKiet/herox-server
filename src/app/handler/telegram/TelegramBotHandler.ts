import { Scenes, session, Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import { logger } from "../../../utils/logger";
import { configDotenv } from "dotenv";
import {
  checkInteractionScene,
  creditsScene,
  deleteUsernameScene,
  getPostsScene,
  postLinksScene,
  setupUserScene,
  adminPostScene,
} from "./scenes";
import {
  BUTTONS,
  COMMANDS,
  KEYBOARDS,
  MESSAGES,
} from "../../../utils/constants/botCommands";
import { InteractXTgBot } from "../../../class";
import { ITelegramUser } from "../../../utils/interfaces";
import { getCollection } from "../../../utils/mongoDb";

configDotenv();

type BotContext = any;

class TelegramBotHandler {
  private bot: Telegraf<BotContext>;
  private stage: Scenes.Stage<BotContext>;

  constructor() {
    // Get token from environment variables
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
      logger.error(
        "TELEGRAM_BOT_TOKEN is not defined in environment variables"
      );
      throw new Error("Bot token not provided");
    }

    // Initialize bot
    this.bot = new Telegraf<BotContext>(botToken);

    // Initialize scenes
    this.stage = new Scenes.Stage<BotContext>([
      setupUserScene,
      getPostsScene,
      checkInteractionScene,
      postLinksScene,
      deleteUsernameScene,
      creditsScene, // Credits scene to show user credit information
      adminPostScene, // Admin post scene - hidden from normal usage
    ]);

    // Set up middleware
    this.setupMiddleware();

    // Set up commands and handlers
    this.setupCommands();
  }

  /**
   * Set up middleware for bot
   */
  private setupMiddleware(): void {
    // Set up session middleware to store user data
    this.bot.use(session());

    // Use stage middleware to manage scenes
    this.bot.use(this.stage.middleware());

    // Log all incoming messages
    this.bot.use(async (ctx, next) => {
      const userId = ctx.from?.id;
      const username = ctx.from?.username;
      const text =
        ctx.message && "text" in ctx.message ? ctx.message.text : null;

      logger.info(`Received message from ${username} (${userId}): ${text}`);

      // Initialize userData if not exists
      if (!ctx.session) {
        ctx.session = {} as any;
      }

      if (!ctx.session) {
        ctx.session = {};
      }

      if (!ctx.session.userData) {
        ctx.session.userData = {
          telegramId: userId || 0, // Use default value if undefined
          usernames: [],
          links: [],
          interactionStatus: {},
        };
      }

      return next();
    });
  }

  /**
   * Handle entering a scene with user status check
   * @param ctx Message context
   * @param sceneName Name of the scene to enter
   */
  private handleSceneEnter(ctx: any, sceneName: string): void {
    // Check which scene the user is currently in
    const currentScene = ctx.scene?.current?.id;

    if (currentScene && currentScene !== sceneName) {
      // If user is in a different scene, notify them to complete or cancel
      ctx.reply(MESSAGES.BUSY_IN_SCENE);
    } else {
      // Otherwise, enter the requested scene
      ctx.scene.enter(sceneName);
    }
  }

  /**
   * Set up commands and event handlers
   */
  private setupCommands(): void {
    // Lệnh /start
    this.bot.command("start", (ctx) => {
      ctx.reply(
        "Welcome to X Interaction Bot!\n\n" +
          "This system helps you with cross-interactions on X (Twitter). Use these commands:\n" +
          "/setup - Set up your profile and register usernames\n" +
          "/delete - Delete specific usernames from your profile\n" +
          "/get - Get interaction tasks\n" +
          "/check - Check your interaction status\n" +
          "/post - Post links to receive interactions\n" +
          "/credits - View your credit balance\n" +
          "/profile - View your profile information\n" +
          "/help - Show help",
        {
          reply_markup: KEYBOARDS.MAIN,
        }
      );
    });

    // Help command
    this.bot.command(COMMANDS.HELP.substring(1), (ctx) => {
      ctx.reply(
        "📚 <b>X Interaction Bot Guide</b>\n\n" +
          `<b>1️⃣ ${BUTTONS.SETUP_PROFILE}</b>: Set up your profile and register X usernames\n\n` +
          `<b>2️⃣ ${BUTTONS.GET_POSTS}</b>: Get a list of links to interact with for each username\n\n` +
          `<b>3️⃣ ${BUTTONS.CHECK_INTERACTIONS}</b>: Check if you've completed all required interactions\n\n` +
          `<b>4️⃣ ${BUTTONS.POST_LINKS}</b>: Post your links to receive interactions from others\n\n` +
          `<b>5️⃣ ${BUTTONS.MY_CREDITS}</b>: Check your available credits and credit history\n\n` +
          "Note: You must complete all required interactions before you can post your own links.",
        { parse_mode: "HTML" }
      );
    });

    // Handle button clicks from keyboard
    this.bot.hears(BUTTONS.SETUP_PROFILE, (ctx) =>
      this.handleSceneEnter(ctx, "setup-user")
    );
    this.bot.hears(BUTTONS.GET_POSTS, (ctx) =>
      this.handleSceneEnter(ctx, "get-posts")
    );
    this.bot.hears(BUTTONS.CHECK_INTERACTIONS, (ctx) =>
      this.handleSceneEnter(ctx, "check-interaction")
    );
    this.bot.hears(BUTTONS.POST_LINKS, (ctx) =>
      this.handleSceneEnter(ctx, "post-links")
    );
    this.bot.hears(BUTTONS.DELETE_USERNAMES, (ctx) =>
      this.handleSceneEnter(ctx, "delete-username")
    );
    this.bot.hears(BUTTONS.HELP, (ctx) =>
      ctx.command(COMMANDS.HELP.substring(1))
    );
    this.bot.hears(BUTTONS.MY_PROFILE, (ctx) => this.handleProfileCommand(ctx));
    this.bot.hears(BUTTONS.MY_CREDITS, (ctx) =>
      this.handleSceneEnter(ctx, "credits")
    );

    // Handle shortcut commands
    this.bot.command(COMMANDS.SETUP.substring(1), (ctx) =>
      this.handleSceneEnter(ctx, "setup-user")
    );
    this.bot.command(COMMANDS.GET_POSTS.substring(1), (ctx) =>
      this.handleSceneEnter(ctx, "get-posts")
    );
    this.bot.command(COMMANDS.CHECK.substring(1), (ctx) =>
      this.handleSceneEnter(ctx, "check-interaction")
    );
    this.bot.command(COMMANDS.POST.substring(1), (ctx) =>
      this.handleSceneEnter(ctx, "post-links")
    );

    // Profile command
    this.bot.command(COMMANDS.PROFILE.substring(1), (ctx) =>
      this.handleProfileCommand(ctx)
    );

    // Delete usernames command
    this.bot.command(COMMANDS.DELETE.substring(1), (ctx) =>
      this.handleSceneEnter(ctx, "delete-username")
    );

    // Credits command
    this.bot.command(COMMANDS.CREDITS.substring(1), (ctx) =>
      this.handleSceneEnter(ctx, "credits")
    );

    // Hidden admin command
    this.bot.command(COMMANDS.ADMIN.substring(1), (ctx) => {
      // Enter admin post scene
      return this.handleSceneEnter(ctx, "admin-post");
    });

    // Handle unrecognized messages
    this.bot.on(message("text"), async (ctx) => {
      // Skip if user is in a scene
      if (ctx.scene?.current) {
        return;
      }

      const text = ctx.message.text;

      // Check if text contains X links
      if (this.isXPostLinks(text)) {
        // Count the actual number of links in the message
        const xRegex =
          /https?:\/\/(www\.)?(twitter\.com|x\.com)\/\w+\/status\/\d+([?#][^\\s]*)?/gi;
        const matches = text.match(xRegex) || [];
        const linkCount = matches.length;

        logger.info(
          `Detected ${linkCount} X link(s) in message from ${ctx.from?.username}`
        );

        // Make sure we have user data
        if (!ctx.session.userData) {
          const userData = await this.loadUserData(ctx);
          if (!userData) {
            await ctx.reply(
              "❌ You need to set up your profile before posting links. Please use /setup command.",
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
            return;
          }
          ctx.session.userData = userData;
        }

        // Store the links in the database instead of session
        const telegramId = ctx.from?.id?.toString();
        if (telegramId) {
          try {
            const usersCollection = getCollection("interactXTgUsers");
            await usersCollection.updateOne(
              { userId: telegramId },
              { $set: { detectedLinks: matches, detectedAt: new Date() } }
            );
            logger.info(
              `Saved ${linkCount} links to database for user ${telegramId}`
            );
          } catch (err) {
            logger.error(`Failed to save detected links to database: ${err}`);
          }
        }

        // Customize message based on number of links
        if (linkCount === 1) {
          await ctx.reply(`✅ Detected 1 X link. Processing...`);
        } else {
          await ctx.reply(`✅ Detected ${linkCount} X links. Processing...`);
        }

        return this.handleSceneEnter(ctx, "post-links");
      }

      // If not a known command
      ctx.reply(
        "I don't understand this command. Please use the buttons below or type /help for guidance.",
        {
          reply_markup: KEYBOARDS.MAIN,
        }
      );
    });
  }

  /**
   * Load user data from database
   */
  private async loadUserData(ctx: any): Promise<any> {
    try {
      const telegramId = ctx.from?.id?.toString();
      if (!telegramId) return null;

      const usersCollection = getCollection<ITelegramUser>("interactXTgUsers");
      const userData = await usersCollection.findOne({ userId: telegramId });

      if (
        userData &&
        userData.registeredUsernames &&
        userData.registeredUsernames.length > 0
      ) {
        return {
          telegramId,
          usernames: userData.registeredUsernames,
          userId: userData.userId,
        };
      }
      return null;
    } catch (error) {
      logger.error(`Error loading user data: ${error}`);
      return null;
    }
  }

  /**
   * Check if text is a list of X links
   */
  private isXPostLinks(text: string): boolean {
    // Enhanced regular expression to check X/Twitter links
    // This handles query parameters and fragments in URLs
    const xRegex =
      /https?:\/\/(www\.)?(twitter\.com|x\.com)\/\w+\/status\/\d+([?#].*)?/i;

    // Check if at least one line matches the X link pattern
    const lines = text.split("\n");
    let matchCount = 0;

    for (const line of lines) {
      if (xRegex.test(line.trim())) {
        matchCount++;
      }
    }

    // Consider even a single X link as valid
    return matchCount >= 1;
  }

  /**
   * Handle profile command
   */
  private async handleProfileCommand(ctx: any): Promise<void> {
    try {
      const userId = ctx.from.id.toString();
      const username = ctx.from.username || "unknown";

      // Import InteractXTgBot
      const interactBot = new InteractXTgBot();

      // Get username information
      const userXUsernames = await interactBot.getUserXUsernames(userId);

      if (!userXUsernames || userXUsernames.length === 0) {
        await ctx.reply(
          "<b>👤 Profile Information</b>\n\n" +
            "You haven't set up your profile yet. Please use /setup command to register your X usernames.",
          {
            parse_mode: "HTML",
            reply_markup: {
              keyboard: [
                [{ text: BUTTONS.SETUP_PROFILE }],
                [{ text: BUTTONS.HELP }],
              ],
              resize_keyboard: true,
            },
          }
        );
        return;
      }

      // Display profile information
      // Format usernames to display one per line
      const formattedUsernames = userXUsernames
        .map((name, index) => `   ${name}`)
        .join("\n");

      await ctx.reply(
        "<b>👤 Profile Information</b>\n\n" +
          `- User ID: ${userId}\n` +
          `- Telegram: @${username}\n` +
          `- Number of registered X usernames: ${userXUsernames.length}\n` +
          `- X usernames:\n${formattedUsernames}\n\n` +
          "You can update your profile using /setup command.\n" +
          "To delete specific usernames, use /delete command.",
        {
          parse_mode: "HTML",
          reply_markup: KEYBOARDS.MAIN,
        }
      );
    } catch (error) {
      logger.error(`Error handling profile command: ${error}`);
      await ctx.reply(
        "❌ An error occurred while retrieving your profile information. Please try again later.",
        {
          reply_markup: KEYBOARDS.MAIN,
        }
      );
    }
  }

  /**
   * Start the bot
   */
  public async start(): Promise<void> {
    try {
      // Get bot information
      const botInfo = await this.bot.telegram.getMe();
      logger.info(`Bot started successfully! @${botInfo.username}`);

      // Start polling to get updates from Telegram
      await this.bot.launch();

      // Handle application shutdown
      process.once("SIGINT", () => this.bot.stop("SIGINT"));
      process.once("SIGTERM", () => this.bot.stop("SIGTERM"));
    } catch (error) {
      logger.error(`Error starting bot: ${error}`);
      throw error;
    }
  }

  /**
   * Webhook mode instead of polling (for production environment)
   * @param webhookUrl Webhook URL
   * @param port Port to listen for webhook
   */
  public async startWebhook(webhookUrl: string, port: number): Promise<void> {
    try {
      // Set up webhook
      await this.bot.telegram.setWebhook(
        `${webhookUrl}/bot${process.env.TELEGRAM_BOT_TOKEN}`
      );

      // Start webhook server
      await this.bot.launch({
        webhook: {
          domain: webhookUrl,
          port: port,
        },
      });

      logger.info(
        `Bot started successfully with webhook at ${webhookUrl}, port ${port}`
      );

      // Handle application shutdown
      process.once("SIGINT", () => this.bot.stop("SIGINT"));
      process.once("SIGTERM", () => this.bot.stop("SIGTERM"));
    } catch (error) {
      logger.error(`Error starting bot with webhook: ${error}`);
      throw error;
    }
  }

  /**
   * Send message to a user
   * @param userId User ID
   * @param message Message content
   * @param options Additional options
   */
  public async sendMessage(
    userId: number | string,
    message: string,
    options?: any
  ): Promise<any> {
    try {
      return await this.bot.telegram.sendMessage(userId, message, options);
    } catch (error) {
      logger.error(`Error sending message to user ${userId}: ${error}`);
      throw error;
    }
  }

  /**
   * Check connection to Telegram API
   * @returns Bot info if connection is successful
   */
  public async checkConnection(): Promise<any> {
    try {
      return await this.bot.telegram.getMe();
    } catch (error) {
      logger.error(`Error checking connection to Telegram: ${error}`);
      throw error;
    }
  }
}

export default TelegramBotHandler;
