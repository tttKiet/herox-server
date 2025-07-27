import { Router, Request, Response } from "express";
import TelegramApiHandler from "../app/handler/telegram/TelegramApiHandler";
import { logger } from "../utils/logger";
import { initializeBot, getBot } from "../services/telegramBotService";

// @ts-ignore
const telegramRouter = Router();
const telegramApiHandler = new TelegramApiHandler();

/**
 * Route API to start the bot
 */
telegramRouter.post("/start-bot", async (req: Request, res: Response) => {
  try {
    const bot = await initializeBot();
    if (bot) {
      res.status(200).json({
        success: true,
        message: "Telegram bot has been started successfully",
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Could not start Telegram bot",
      });
    }
  } catch (error: any) {
    logger.error(`Error starting bot: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Could not start Telegram bot",
      error: error.message,
    });
  }
});

/**
 * Route API to check bot status
 */
telegramRouter.get("/bot-status", async (req: Request, res: Response) => {
  try {
    const bot = getBot();
    const isActive = bot !== null;

    // More details about the status
    let details = "Bot is not initialized";
    if (isActive) {
      details = "Bot is initialized and running";
    }

    res.status(200).json({
      success: true,
      active: isActive,
      mode: process.env.NODE_ENV === "development" ? "polling" : "webhook",
      details: details,
      config: {
        webhook_url: process.env.TELEGRAM_WEBHOOK_URL || "not set",
        port: process.env.TELEGRAM_WEBHOOK_PORT || "not set",
        auto_start: process.env.AUTO_START_BOT === "true",
        node_env: process.env.NODE_ENV || "not set",
      },
    });
  } catch (error: any) {
    logger.error(`Error checking bot status: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Could not check bot status",
      error: error.message,
    });
  }
});

/**
 * Route API to send a notification to a specific user
 */
telegramRouter.post("/send-notification", telegramApiHandler.sendNotification);

/**
 * Route API to check if the user has commented enough on the required posts
 */
telegramRouter.post(
  "/verify-interactions",
  telegramApiHandler.verifyInteractions
);

/**
 * Route API to debug the connection with the Bot API
 */
telegramRouter.get("/debug", async (req: Request, res: Response) => {
  try {
    // Start the bot if it's not started yet
    const bot = getBot() || (await initializeBot());

    // Check connection to Telegram API
    if (!bot) {
      res.status(200).json({
        success: false,
        is_active: false,
        message: "Bot is not started",
      });
      return;
    }

    try {
      // Try checking connection
      const botInfo = await bot.checkConnection();

      res.status(200).json({
        success: true,
        is_active: true,
        bot_info: botInfo,
        message: "Bot has started and connected successfully to Telegram API",
      });
    } catch (botError: any) {
      res.status(500).json({
        success: false,
        message: "Bot has started but cannot connect to Telegram API",
        error: botError.message,
      });
    }
  } catch (error: any) {
    logger.error(`Error debugging bot: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "General error",
      error: error.message,
    });
  }
});

export default telegramRouter;
