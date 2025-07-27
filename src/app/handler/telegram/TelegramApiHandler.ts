import { Request, Response, RequestHandler } from "express";
import { logger } from "../../../utils/logger";
import TelegramService from "./TelegramService";

/**
 * Handler để xử lý các yêu cầu API liên quan đến Bot Telegram
 */
class TelegramApiHandler {
  private telegramService: TelegramService;

  constructor() {
    this.telegramService = new TelegramService();

    // Bind các methods để giữ context this
    this.sendNotification = this.sendNotification.bind(this);
    this.verifyInteractions = this.verifyInteractions.bind(this);
  }

  /**
   * Gửi tin nhắn đến một người dùng cụ thể
   */
  public sendNotification(req: Request, res: Response): void {
    const { userId, message } = req.body;

    if (!userId || !message) {
      res.status(400).json({
        success: false,
        message: "Thiếu userId hoặc message",
      });
      return;
    }

    // Import TelegramBotHandler
    const TelegramBotHandler = require("./TelegramBotHandler").default;
    const botHandler = new TelegramBotHandler();

    // Khởi động bot nếu cần và gửi tin nhắn
    botHandler
      .start()
      .then(() => {
        return botHandler.sendMessage(userId, message, {
          parse_mode: "HTML",
        });
      })
      .then(() => {
        res.status(200).json({
          success: true,
          message: "Đã gửi thông báo thành công",
        });
      })
      .catch((error: any) => {
        logger.error(`Lỗi khi gửi thông báo: ${error.message}`);
        res.status(500).json({
          success: false,
          message: "Không thể gửi thông báo",
          error: error.message,
        });
      });
  }

  /**
   * Kiểm tra xem người dùng đã comment đủ các bài đăng yêu cầu chưa
   */
  public verifyInteractions(req: Request, res: Response): void {
    const { telegramId, tasks, cookie } = req.body;

    if (!telegramId) {
      res.status(400).json({
        success: false,
        message: "Thiếu telegramId",
      });
      return;
    }

    // Gọi phương thức verifyUserInteractions
    this.telegramService
      .verifyUserInteractions(telegramId, tasks, cookie)
      .then((result) => {
        res.status(200).json(result);
      })
      .catch((error: any) => {
        logger.error(`Lỗi khi kiểm tra tương tác: ${error.message}`);
        res.status(500).json({
          success: false,
          message: "Không thể kiểm tra tương tác",
          error: error.message,
        });
      });
  }
}

export default TelegramApiHandler;
