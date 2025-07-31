import "dotenv/config";
import { ObjectId } from "mongodb";
import { logger } from "../utils/logger";
import { getCollection } from "../utils/mongoDb";
import { IInteractXSettings } from "../utils/interfaces";

/**
 * Lớp quản lý cài đặt hệ thống tương tác X
 */
class SettingsManager {
  /**
   * Khởi tạo cài đặt mặc định khi hệ thống khởi động
   */
  async initDefaultSettings(): Promise<IInteractXSettings> {
    try {
      const settingsCollection =
        getCollection<IInteractXSettings>("interactXSettings");

      // Kiểm tra xem đã có cài đặt trong CSDL chưa
      const existingSettings = await settingsCollection.findOne({});

      if (existingSettings) {
        logger.info(
          `Đã tìm thấy cài đặt trong CSDL: n=${existingSettings.minimumLinksForTask}, t=${existingSettings.additionalLinks}`
        );
        return existingSettings;
      }

      // Cài đặt mặc định
      const defaultSettings: IInteractXSettings = {
        minimumLinksForTask: 20, // Số link thấp nhất để hoàn thành nhiệm vụ
        additionalLinks: 5, // Số link thêm vào
        selectionMethod: "least-interactions", // Cách lấy bài đăng: cũ nhất
        additionalLinkSource: "admin", // Nguồn link bổ sung: admin
        minimumLinkForAdmin: 10, // Số link cần thiết cho admin
        updatedAt: new Date(),
        updatedBy: "system", // Người cập nhật mặc định
      };

      // Thêm cài đặt mặc định vào CSDL
      await settingsCollection.insertOne(defaultSettings);

      logger.success("Đã khởi tạo cài đặt mặc định cho hệ thống tương tác X");
      return defaultSettings;
    } catch (error) {
      logger.error(`Lỗi khi khởi tạo cài đặt mặc định: ${error}`);
      throw error;
    }
  }

  /**
   * Lấy cài đặt hiện tại
   */
  async getSettings(): Promise<IInteractXSettings | null> {
    try {
      const settingsCollection =
        getCollection<IInteractXSettings>("interactXSettings");
      return await settingsCollection.findOne({});
    } catch (error) {
      logger.error(`Lỗi khi lấy cài đặt: ${error}`);
      return null;
    }
  }

  /**
   * Cập nhật cài đặt hệ thống
   * @param settings Cài đặt mới
   * @param updatedBy ID người cập nhật
   */
  async updateSettings(
    settings: Partial<IInteractXSettings>,
    updatedBy: string
  ): Promise<IInteractXSettings | null> {
    try {
      const settingsCollection =
        getCollection<IInteractXSettings>("interactXSettings");
      const existingSettings = await settingsCollection.findOne({});

      if (!existingSettings) {
        logger.error("Không tìm thấy cài đặt để cập nhật");
        return null;
      }

      const updatedSettings = {
        ...existingSettings,
        ...settings,
        updatedAt: new Date(),
        updatedBy,
      };

      const result = await settingsCollection.updateOne(
        {},
        { $set: updatedSettings }
      );

      if (result.modifiedCount === 0) {
        logger.error("Không thể cập nhật cài đặt");
        return null;
      }

      logger.success(`Đã cập nhật cài đặt bởi ${updatedBy}`);
      return updatedSettings;
    } catch (error) {
      logger.error(`Lỗi khi cập nhật cài đặt: ${error}`);
      return null;
    }
  }

  /**
   * Tính toán số lượng link cần lấy dựa trên cài đặt
   */
  async calculateLinkDistribution(): Promise<{
    requiredLinks: number;
    totalLinks: number;
    sourceForAdditionalLinks: "member" | "admin";
  }> {
    const settings = await this.getSettings();

    if (!settings) {
      // Sử dụng giá trị mặc định nếu không có cài đặt
      return {
        requiredLinks: 20,
        totalLinks: 25,
        sourceForAdditionalLinks: "admin",
      };
    }

    return {
      requiredLinks: settings.minimumLinksForTask,
      totalLinks: settings.minimumLinksForTask + settings.additionalLinks,
      sourceForAdditionalLinks: settings.additionalLinkSource,
    };
  }
}

export default SettingsManager;
