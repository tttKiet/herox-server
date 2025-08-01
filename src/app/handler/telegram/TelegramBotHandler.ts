import { Scenes, session, Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import { logger } from "../../../utils/logger";
import { configDotenv } from "dotenv";
import {
  // checkInteractionScene,
  checkInteractionsScene,
  creditsScene,
  deleteUsernameScene,
  getPostsScene,
  postLinksScene,
  setupUserScene,
  adminPostScene,
  myLinksScene,
} from "./scenes";
import checkSingleUsernameScene from "./scenes/checkSingleUsernameScene";
import {
  BUTTONS,
  COMMANDS,
  KEYBOARDS,
  MESSAGES,
} from "../../../utils/constants/botCommands";
import { NAV_KEYBOARDS } from "../../../utils/constants/navKeyboards";
import { InteractXTgBot } from "../../../class";
import { ITelegramUser } from "../../../utils/interfaces";
import { getCollection } from "../../../utils/mongoDb";
import { inlineKeyboard } from "telegraf/typings/markup";

configDotenv();

type BotContext = any;

class TelegramBotHandler {
  private bot: Telegraf<BotContext>;
  private stage: Scenes.Stage<BotContext>;

  // Maps to track users waiting for specific inputs
  private waitingForCheckUsername = new Map<number, boolean>();

  /**
   * Tin nhắn chào mừng tiêu chuẩn
   */
  private readonly WELCOME_MESSAGE =
    "Welcome to X Interaction Bot! 🚀\n\n" +
    "This system helps you with cross-interactions on X (Twitter).\n\n" +
    "To get started:\n" +
    "• Click on 'Setup Profile' to register your X usernames\n" +
    "• Check your credits with 'Credits'\n" +
    "• View your registered accounts with 'Profile'\n\n" +
    "Use the Menu button to access all features, or use the options below:";

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
      // checkInteractionScene, // Legacy scene
      checkInteractionsScene, // New refactored scene
      checkSingleUsernameScene, // Add new scene for checking single username
      postLinksScene,
      deleteUsernameScene,
      myLinksScene, // Add new scene for showing user's links
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
   * @param state Optional state to pass to the scene
   */
  private handleSceneEnter(ctx: any, sceneName: string, state?: any): void {
    // Check which scene the user is currently in
    const currentScene = ctx.scene?.current?.id;

    if (currentScene && currentScene !== sceneName) {
      // If user is in a different scene, notify them to complete or cancel
      ctx.reply(MESSAGES.BUSY_IN_SCENE);
    } else {
      // Otherwise, enter the requested scene
      if (state) {
        ctx.scene.enter(sceneName, state);
      } else {
        ctx.scene.enter(sceneName);
      }
    }
  }

  /**
   * Set up commands and event handlers
   */
  private setupCommands(): void {
    // Lệnh /start
    this.bot.command("start", (ctx) => {
      ctx.reply(this.WELCOME_MESSAGE, {
        reply_markup: {
          inline_keyboard: NAV_KEYBOARDS.START_MENU.inline_keyboard,
        },
        parse_mode: "HTML",
      });
    });

    // Help command
    this.bot.command(COMMANDS.HELP.substring(1), (ctx) => {
      ctx.reply(
        "📚 <b>X Interaction Bot Guide</b>\n\n" +
          `<b>1️⃣ ${BUTTONS.SETUP_PROFILE}</b>: Set up your profile and register X usernames\n\n` +
          `<b>2️⃣ ${BUTTONS.GET_POSTS}</b>: Get a list of links to interact with for each username\n` +
          `   - Use /get to get posts for all usernames\n` +
          `   - Use /get username to get posts only for a specific username\n\n` +
          `<b>3️⃣ ${BUTTONS.CHECK_INTERACTIONS}</b>: Check if you've completed all required interactions\n` +
          `   - Use /check to check all usernames\n` +
          `   - Use /check username to check a specific username\n\n` +
          `<b>4️⃣ ${BUTTONS.POST_LINKS}</b>: Post your links to receive interactions from others\n\n` +
          `<b>5️⃣ ${BUTTONS.MY_CREDITS}</b>: Check your available credits and credit history\n\n` +
          `<b>6️⃣ ${BUTTONS.MY_LINKS}</b>: View all links you've submitted by username\n\n` +
          "Note: You must complete all required interactions before you can post your own links.",
        {
          parse_mode: "HTML",
          reply_markup: NAV_KEYBOARDS.START_MENU,
        }
      );
    });

    // Handle button clicks from keyboard
    this.bot.hears(BUTTONS.SETUP_PROFILE, (ctx) => {
      this.handleSceneEnter(ctx, "setup-user");
    });
    this.bot.hears(BUTTONS.GET_POSTS, (ctx) => {
      // Show the GET_POSTS_OPTIONS_PAGE keyboard
      ctx.reply("Choose how you want to get posts:", {
        reply_markup: KEYBOARDS.GET_POSTS_OPTIONS_PAGE,
      });
    });

    // New handlers for specific get posts options
    this.bot.hears(BUTTONS.GET_POSTS_ALL, (ctx) => {
      this.handleSceneEnter(ctx, "get-posts");
    });

    this.bot.hears(BUTTONS.GET_POSTS_SINGLE, (ctx) => {
      ctx.reply(
        "Please enter the username you want to get posts for in this format:\n\n" +
          "<code>username</code>\n\n" +
          "Or use /cancel to cancel.",
        {
          parse_mode: "HTML",
        }
      );
      ctx.session.waitingForUsername = true;
    });
    this.bot.hears(BUTTONS.CHECK_INTERACTIONS, (ctx) => {
      this.handleSceneEnter(ctx, "check-interaction");
    });
    this.bot.hears(BUTTONS.POST_LINKS, (ctx) => {
      this.handleSceneEnter(ctx, "post-links");
    });
    this.bot.hears(BUTTONS.DELETE_USERNAMES, (ctx) => {
      // Show the DELETE_USERNAMES_PAGE keyboard
      ctx.reply("Loading delete usernames menu...", {
        reply_markup: KEYBOARDS.DELETE_USERNAMES_PAGE,
      });
      this.handleSceneEnter(ctx, "delete-username");
    });
    this.bot.hears(BUTTONS.HELP, (ctx) => {
      ctx.command(COMMANDS.HELP.substring(1));
    });
    this.bot.hears(BUTTONS.MY_PROFILE, (ctx) => this.handleProfileCommand(ctx));
    this.bot.hears(BUTTONS.MY_CREDITS, (ctx) => {
      // Instead of entering the scene directly, show inline buttons
      ctx.reply("Choose an option:", {
        reply_markup: NAV_KEYBOARDS.CREDITS_PROFILE,
      });
    });
    this.bot.hears(BUTTONS.MY_LINKS, (ctx) => {
      // Instead of entering the scene directly, we'll enter the scene with inline buttons
      this.handleSceneEnter(ctx, "my-links");
    });
    this.bot.hears(BUTTONS.ALL_OPTIONS, (ctx) => {
      ctx.reply(this.WELCOME_MESSAGE, {
        parse_mode: "HTML",
        reply_markup: NAV_KEYBOARDS.START_MENU,
      });
    });

    // Handle shortcut commands
    this.bot.command(COMMANDS.SETUP.substring(1), (ctx) =>
      this.handleSceneEnter(ctx, "setup-user")
    );
    this.bot.command(COMMANDS.GET_POSTS.substring(1), (ctx) => {
      // Check if a username was provided as parameter
      const text = ctx.message?.text || "";
      const parts = text.split(" ");

      if (parts.length > 1) {
        // Username was provided - store it in context
        const username = parts[1].toLowerCase().trim();
        const state = { specificUsername: username };
        logger.info(`Getting posts for specific username: ${username}`);

        // Enter the get-posts scene with the specific username state
        return this.handleSceneEnter(ctx, "get-posts", state);
      }

      // Enter the get-posts scene without specific username
      return this.handleSceneEnter(ctx, "get-posts");
    });
    this.bot.command(COMMANDS.CHECK.substring(1), (ctx) =>
      this.handleCheckCommand(ctx)
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

    // My Links command
    this.bot.command(COMMANDS.LINKS.substring(1), (ctx) =>
      this.handleSceneEnter(ctx, "my-links")
    );

    // Credits command
    this.bot.command(COMMANDS.CREDITS.substring(1), (ctx) => {
      // Show inline buttons instead
      ctx.reply("Choose an option:", {
        reply_markup: NAV_KEYBOARDS.CREDITS_PROFILE,
      });
    });

    // Handle callback queries from inline buttons
    this.bot.on("callback_query", async (ctx) => {
      // Get the callback data
      const callbackData = (ctx.callbackQuery as any)?.data;

      if (!callbackData) {
        return;
      }

      // Handle different callback queries
      switch (callbackData) {
        case "nav_credits":
          // Enter credits scene
          await ctx.answerCbQuery("Loading credits information...");
          this.handleSceneEnter(ctx, "credits");
          break;

        case "nav_profile":
          // Show profile information
          await ctx.answerCbQuery("Loading profile information...");
          this.handleProfileCommand(ctx);
          break;

        case "nav_post":
          // Enter post links scene
          await ctx.answerCbQuery("Loading post links form...");
          this.handleSceneEnter(ctx, "post-links");
          break;

        case "nav_setup":
          // Enter setup scene
          await ctx.answerCbQuery("Loading setup profile form...");
          this.handleSceneEnter(ctx, "setup-user");
          break;

        case "nav_get_posts_menu":
          // Show Get Posts menu options
          await ctx.answerCbQuery("Loading posts menu...");
          ctx.reply("Choose how you want to get posts:", {
            reply_markup: KEYBOARDS.GET_POSTS_OPTIONS_PAGE,
          });
          break;

        case "nav_get_posts_all":
          // Get posts for all usernames
          await ctx.answerCbQuery("Loading posts for all usernames...");
          this.handleSceneEnter(ctx, "get-posts");
          break;

        case "nav_get_posts_single":
          // Show prompt for entering username
          await ctx.answerCbQuery("Loading username prompt...");
          const usernameMsg = await ctx.reply(
            "Please enter the username you want to get posts for in this format:\n\n" +
              "<code>username</code>\n\n" +
              "Or click 'Cancel' to go back.",
            {
              parse_mode: "HTML",
              reply_markup: {
                inline_keyboard: [
                  [{ text: "❌ Cancel", callback_data: "nav_close" }],
                ],
              },
            }
          );

          // Store message ID to delete it later
          ctx.session.usernamePromptMsgId = usernameMsg.message_id;

          // Enter a special scene or set a flag to handle the username input
          ctx.session.waitingForUsername = true;
          break;

        case "nav_my_links":
          // Enter my links scene
          await ctx.answerCbQuery("Loading your links...");
          this.handleSceneEnter(ctx, "my-links");
          break;

        case "nav_help":
          // Show help message
          await ctx.answerCbQuery("Loading help information...");
          // Send the help message directly
          ctx.reply(
            "📚 <b>X Interaction Bot Guide</b>\n\n" +
              `<b>1️⃣ ${BUTTONS.SETUP_PROFILE}</b>: Set up your profile and register X usernames\n\n` +
              `<b>2️⃣ ${BUTTONS.GET_POSTS}</b>: Get a list of links to interact with for each username\n` +
              `   - Use /get to get posts for all usernames\n` +
              `   - Use /get username to get posts only for a specific username\n\n` +
              `<b>3️⃣ ${BUTTONS.CHECK_INTERACTIONS}</b>: Check if you've completed all required interactions\n` +
              `   - Use /check to check all usernames\n` +
              `   - Use /check username to check a specific username\n\n` +
              `<b>4️⃣ ${BUTTONS.POST_LINKS}</b>: Post your links to receive interactions from others\n\n` +
              `<b>5️⃣ ${BUTTONS.MY_CREDITS}</b>: Check your available credits and credit history\n\n` +
              `<b>6️⃣ ${BUTTONS.MY_LINKS}</b>: View all links you've submitted by username\n\n` +
              `<b>7️⃣ ${BUTTONS.MY_PROFILE}</b>: Check your profile information`,
            {
              parse_mode: "HTML",
              reply_markup: NAV_KEYBOARDS.START_MENU,
            }
          );
          break;

        case "nav_check_interactions_all":
          // Check interactions for all usernames
          await ctx.answerCbQuery(
            "Loading interaction check for all usernames..."
          );
          this.handleSceneEnter(ctx, "check-interactions");
          break;

        case "nav_check_interactions_single":
          // Show prompt for entering username to check
          await ctx.answerCbQuery(
            "Loading username prompt for interaction check..."
          );
          const checkUsernameMsg = await ctx.reply(
            "Please enter the username you want to check interactions for in this format:\n\n" +
              "<code>username</code>\n\n" +
              "Or click 'Cancel' to go back.",
            {
              parse_mode: "HTML",
              reply_markup: {
                inline_keyboard: [
                  [{ text: "❌ Cancel", callback_data: "nav_close" }],
                ],
              },
            }
          );

          // Start listening for the username input
          this.waitingForCheckUsername.set(ctx.from.id, true);
          break;

        case "nav_close":
          // Close the message with the inline keyboard
          await ctx.answerCbQuery("Closed");
          try {
            // Try to delete the message with the inline keyboard
            await ctx.deleteMessage();
            // After deleting, send a new message with welcome text
            await ctx.reply(MESSAGES.WELCOME, {
              parse_mode: "HTML",
              reply_markup: NAV_KEYBOARDS.START_MENU,
            });
          } catch (error) {
            logger.error(`Error deleting message: ${error}`);
            // If deletion fails, edit the message instead
            await ctx.editMessageText(MESSAGES.WELCOME, {
              parse_mode: "HTML",
              reply_markup: NAV_KEYBOARDS.START_MENU,
            });
          }
          break;

        default:
          await ctx.answerCbQuery();
          break;
      }
    });

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

      // Check if we're waiting for a username input for get-posts
      if (ctx.session.waitingForUsername) {
        // Reset the flag
        ctx.session.waitingForUsername = false;

        // Delete the prompt message if we have its ID
        if (ctx.session.usernamePromptMsgId) {
          try {
            await ctx.deleteMessage(ctx.session.usernamePromptMsgId);
            delete ctx.session.usernamePromptMsgId;
          } catch (err) {
            logger.warn(`Failed to delete prompt message: ${err}`);
          }
        }

        // Process the username
        const username = text.trim().replace("@", "");
        if (username) {
          logger.info(`User provided username for get posts: ${username}`);

          // Create state with specific username
          const state = { specificUsername: username };

          // Enter get-posts scene with the specific username
          return this.handleSceneEnter(ctx, "get-posts", state);
        } else {
          await ctx.reply(
            "Invalid username. Please try again with a valid username."
          );
          return;
        }
      }

      // Check if we're waiting for a username input for check-interactions
      if (this.waitingForCheckUsername.get(ctx.from.id)) {
        // Reset the flag
        this.waitingForCheckUsername.delete(ctx.from.id);

        // Process the username
        const username = text.trim().replace("@", "");
        if (username) {
          logger.info(
            `User provided username for check interactions: ${username}`
          );

          // Create state with username
          const state = { username: username };

          // Enter check-interactions scene with the specific username
          return this.handleSceneEnter(ctx, "check-interactions", state);
        } else {
          await ctx.reply(
            "Invalid username. Please try again with a valid username."
          );
          return;
        }
      }

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
                reply_markup: NAV_KEYBOARDS.START_MENU,
                parse_mode: "HTML",
              }
            );
            return;
          }
          ctx.session.userData = userData;
        } // Store the links in the database instead of session
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

        // // Customize message based on number of links
        // if (linkCount === 1) {
        //   await ctx.reply(`✅ Detected 1 X link. Processing...`, {
        //     reply_markup: NAV_KEYBOARDS.START_MENU,
        //     parse_mode: "HTML",
        //   });
        // } else {
        //   await ctx.reply(`✅ Detected ${linkCount} X links. Processing...`, {
        //     reply_markup: NAV_KEYBOARDS.START_MENU,
        //     parse_mode: "HTML",
        //   });
        // }

        return this.handleSceneEnter(ctx, "post-links");
      }

      // If not a known command
      ctx.reply(
        "I don't understand this command. Please use the menu below or type /help for guidance.",
        {
          reply_markup: NAV_KEYBOARDS.START_MENU,
          parse_mode: "HTML",
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
   * Handle check command
   * Format: /check [username]
   * If username is provided, check only that username's interactions
   * If not, check all usernames
   */
  private async handleCheckCommand(ctx: any): Promise<void> {
    try {
      // Get command arguments (check if there's a username provided)
      const message = ctx.message.text;
      const args = message.split(/\s+/);

      logger.info(`Check command received with args: ${JSON.stringify(args)}`);

      // If there's a username provided (format: /check username)
      if (args.length > 1 && args[1].trim() !== "") {
        const username = args[1].replace("@", ""); // Remove @ if present

        // Load user data to verify the username belongs to them
        const userData = await this.loadUserData(ctx);

        if (!userData || !userData.usernames) {
          await ctx.reply(
            "❌ You haven't set up your profile yet. Please use /setup command first.",
            {
              parse_mode: "HTML",
              reply_markup: NAV_KEYBOARDS.START_MENU,
            }
          );
          return;
        }

        // Verify username belongs to user
        const usernamesLower = userData.usernames.map((u) => u.toLowerCase());
        if (!usernamesLower.includes(username.toLowerCase())) {
          await ctx.reply(
            `❌ Username @${username} is not registered in your profile. Please check your usernames with /profile command.`,
            {
              parse_mode: "HTML",
              reply_markup: NAV_KEYBOARDS.START_MENU,
            }
          );
          return;
        }

        // Store username in scene state and enter check-interactions scene with username
        logger.info(
          `Entering check-interactions scene with username: ${username}`
        );
        return ctx.scene.enter("check-interactions", { username });
      }

      // If no username was provided, check all accounts
      return this.handleSceneEnter(ctx, "check-interactions");
    } catch (error) {
      logger.error(`Error handling check command: ${error}`);
      await ctx.reply(
        "❌ An error occurred while processing your command. Please try again later.",
        {
          parse_mode: "HTML",
          reply_markup: NAV_KEYBOARDS.START_MENU,
        }
      );
    }
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
            reply_markup: NAV_KEYBOARDS.START_MENU,
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
          `- X usernames:\n<b>${formattedUsernames}</b>\n\n` +
          "You can manage your profile using the buttons below:",
        {
          parse_mode: "HTML",
          reply_markup: NAV_KEYBOARDS.START_MENU,
        }
      );
    } catch (error) {
      logger.error(`Error handling profile command: ${error}`);
      await ctx.reply(
        "❌ An error occurred while retrieving your profile information. Please try again later.",
        {
          parse_mode: "HTML",
          reply_markup: NAV_KEYBOARDS.START_MENU,
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
   * Update menu keyboard for a specific user
   * @param userId User ID to update menu for
   * @param keyboardType Type of keyboard to show (from KEYBOARDS object)
   * @param message Optional message to send with the keyboard
   */
  public async updateMenu(
    userId: number | string,
    keyboardType: string,
    message: string = "Menu updated"
  ): Promise<any> {
    try {
      // Get the keyboard from the KEYBOARDS object using keyboardType
      const keyboard = KEYBOARDS[keyboardType];

      if (!keyboard) {
        logger.error(`Invalid keyboard type: ${keyboardType}`);
        return false;
      }

      return await this.bot.telegram.sendMessage(userId, message, {
        reply_markup: keyboard,
      });
    } catch (error) {
      logger.error(`Error updating menu for user ${userId}: ${error}`);
      return false;
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
