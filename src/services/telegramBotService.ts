import TelegramBotHandler from "../app/handler/telegram/TelegramBotHandler";
import { logger } from "../utils/logger";

// Biến lưu trữ instance của bot
let telegramBot: TelegramBotHandler | null = null;

export const initializeBot = async (): Promise<TelegramBotHandler | null> => {
  try {
    if (!telegramBot) {
      telegramBot = new TelegramBotHandler();

      try {
        // Sử dụng polling trong môi trường development
        if (process.env.NODE_ENV === "development") {
          logger.info("Khởi động bot ở chế độ polling");
          await telegramBot.start();
        }
        // Sử dụng webhook trong môi trường production
        else {
          const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;
          const port = parseInt(process.env.TELEGRAM_WEBHOOK_PORT || "3000");

          if (!webhookUrl) {
            throw new Error(
              "TELEGRAM_WEBHOOK_URL không được cung cấp trong biến môi trường"
            );
          }

          logger.info(
            `Khởi động bot với webhook: ${webhookUrl}, port: ${port}`
          );
          await telegramBot.startWebhook(webhookUrl, port);
        }
      } catch (startError: any) {
        logger.error(`Lỗi khi khởi động bot: ${startError}`);
        telegramBot = null;
        throw startError;
      }

      logger.info("Bot Telegram đã được khởi tạo thành công");
    } else {
      logger.info("Bot Telegram đã được khởi tạo trước đó");
    }

    return telegramBot;
  } catch (error: any) {
    logger.error(`Lỗi khi khởi tạo bot Telegram: ${error.message}`);
    return null;
  }
};

/**
 * Lấy instance hiện tại của bot (nếu có)
 */
export const getBot = (): TelegramBotHandler | null => {
  return telegramBot;
};

/**
 * Kiểm tra xem bot đã được khởi tạo hay chưa
 */
export const isBotInitialized = (): boolean => {
  return telegramBot !== null;
};
