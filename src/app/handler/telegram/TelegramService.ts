import axios from "axios";
import { logger } from "../../../utils/logger";

/**
 * Service để quản lý tương tác với bot Telegram
 */
class TelegramService {
  private apiBaseUrl: string;
  private apiKey: string;

  constructor() {
    this.apiBaseUrl =
      process.env.API_BASE_URL || "http://localhost:3000/api/v1";
    this.apiKey = process.env.API_KEY || "";
  }

  /**
   * Lưu thông tin người dùng Telegram và username X
   * @param telegramId ID của người dùng Telegram
   * @param telegramUsername Username của người dùng Telegram
   * @param xUsernames Danh sách username X
   * @returns Kết quả từ API
   */
  public async saveUserProfile(
    telegramId: number,
    telegramUsername: string,
    xUsernames: string[]
  ): Promise<any> {
    try {
      const response = await axios.post(
        `${this.apiBaseUrl}/telegram/user-profile`,
        {
          telegramId,
          telegramUsername,
          xUsernames,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error: any) {
      logger.error(`Lỗi khi lưu thông tin người dùng: ${error.message}`);
      throw new Error(`Không thể lưu thông tin người dùng: ${error.message}`);
    }
  }

  /**
   * Lấy danh sách nhiệm vụ cho người dùng
   * @param telegramId ID của người dùng Telegram
   * @returns Danh sách nhiệm vụ tương tác
   */
  public async getTasks(telegramId: number): Promise<any> {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/telegram/tasks`, {
        params: { telegramId },
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      return response.data;
    } catch (error: any) {
      logger.error(`Lỗi khi lấy nhiệm vụ: ${error.message}`);
      throw new Error(`Không thể lấy danh sách nhiệm vụ: ${error.message}`);
    }
  }

  /**
   * Kiểm tra tương tác cho một người dùng
   * @param telegramId ID của người dùng Telegram
   * @returns Kết quả kiểm tra tương tác
   */
  public async checkInteractions(telegramId: number): Promise<any> {
    try {
      const response = await axios.post(
        `${this.apiBaseUrl}/telegram/check-interactions`,
        { telegramId },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error: any) {
      logger.error(`Lỗi khi kiểm tra tương tác: ${error.message}`);
      throw new Error(`Không thể kiểm tra tương tác: ${error.message}`);
    }
  }

  /**
   * Lưu danh sách link của người dùng
   * @param telegramId ID của người dùng Telegram
   * @param links Danh sách link cần lưu
   * @returns Kết quả từ API
   */
  public async saveUserLinks(
    telegramId: number,
    links: string[]
  ): Promise<any> {
    try {
      const response = await axios.post(
        `${this.apiBaseUrl}/telegram/user-links`,
        {
          telegramId,
          links,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error: any) {
      logger.error(`Lỗi khi lưu link của người dùng: ${error.message}`);
      throw new Error(`Không thể lưu link của người dùng: ${error.message}`);
    }
  }

  /**
   * Kiểm tra một comment cụ thể
   * @param tweetUrl URL của tweet
   * @param username Username X cần kiểm tra
   * @param cookie Cookie X để gọi API (tùy chọn)
   * @returns Kết quả kiểm tra comment
   */
  public async checkComment(
    tweetUrl: string,
    username: string,
    cookie?: string
  ): Promise<any> {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/x/check-comment`, {
        params: {
          apiKey: this.apiKey,
          tweetUrl,
          username,
          cookie,
        },
      });

      return response.data;
    } catch (error: any) {
      logger.error(`Lỗi khi kiểm tra comment: ${error.message}`);
      throw new Error(`Không thể kiểm tra comment: ${error.message}`);
    }
  }

  /**
   * Tạo các file nhiệm vụ dựa trên danh sách nhiệm vụ
   * @param tasks Danh sách nhiệm vụ
   * @returns Object với các file (username -> nội dung file)
   */
  public generateTaskFiles(tasks: any): Record<string, string> {
    const taskFiles: Record<string, string> = {};

    for (const username in tasks) {
      const userTasks = tasks[username];
      let fileContent = `NHIỆM VỤ TƯƠNG TÁC CHO USERNAME: ${username}\n`;
      fileContent += `Thời gian: ${new Date().toLocaleString()}\n\n`;
      fileContent += `Tổng số link cần tương tác: ${userTasks.length}\n\n`;

      userTasks.forEach((task: any, index: number) => {
        fileContent += `${index + 1}. ${task.url}\n`;
      });

      fileContent += `\nLưu ý: Hãy comment vào tất cả các link trên với tài khoản @${username} để hoàn thành nhiệm vụ.`;
      taskFiles[username] = fileContent;
    }

    return taskFiles;
  }

  /**
   * Kiểm tra xem người dùng đã comment đầy đủ các bài đăng yêu cầu chưa
   * @param telegramId ID của người dùng Telegram
   * @param tasks Danh sách nhiệm vụ cần kiểm tra
   * @param cookie Cookie X để gọi API (tùy chọn)
   * @returns Kết quả với trạng thái đã comment đủ hay chưa
   */
  public async verifyUserInteractions(
    telegramId: number,
    tasks: Record<string, string[]>,
    cookie?: string
  ): Promise<{
    success: boolean;
    completedAll: boolean;
    results: Record<
      string,
      {
        username: string;
        completed: number;
        total: number;
        pendingLinks: string[];
        isCompleted: boolean;
      }
    >;
    message: string;
  }> {
    // Hàm này sẽ được triển khai đầy đủ sau
    // Trả về true để tiện cho việc test
    logger.info(`Kiểm tra tương tác cho người dùng ${telegramId}`);
    return {
      success: true,
      completedAll: true,
      results: {},
      message: "Tất cả các tương tác đã được hoàn thành",
    };
  }
}

export default TelegramService;
