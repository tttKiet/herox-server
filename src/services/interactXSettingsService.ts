import { ObjectId } from "mongodb";
import { getCollection } from "../utils/mongoDb";
import { logger } from "../utils/logger";
import { IInteractXSettings } from "../utils/interfaces";

/**
 * Service quản lý cấu hình InteractXSettings
 */
class InteractXSettingsService {
  private readonly collectionName = "interactXSettings";

  /**
   * Lấy cấu hình hiện tại (mặc định chỉ có 1 bản ghi settings)
   */
  async getSettings(): Promise<IInteractXSettings | null> {
    try {
      const collection = getCollection<IInteractXSettings>(this.collectionName);
      return await collection.findOne({});
    } catch (error: any) {
      logger.error(`Lỗi khi lấy InteractXSettings: ${error.message}`);
      return null;
    }
  }

  /**
   * Cập nhật cấu hình InteractXSettings
   * @param updateData Dữ liệu cập nhật
   */
  async updateSettings(
    updateData: Partial<IInteractXSettings>
  ): Promise<IInteractXSettings | null> {
    try {
      const collection = getCollection<IInteractXSettings>(this.collectionName);
      const current = await collection.findOne({});
      if (!current) {
        // Nếu chưa có settings, tạo mới
        const newSettings: IInteractXSettings = {
          ...updateData,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as IInteractXSettings;
        const result = await collection.insertOne(newSettings);
        return { ...newSettings, _id: result.insertedId };
      } else {
        // Nếu đã có, cập nhật
        const update = {
          ...updateData,
          updatedAt: new Date(),
        };
        await collection.updateOne({ _id: current._id }, { $set: update });
        return await collection.findOne({ _id: current._id });
      }
    } catch (error: any) {
      logger.error(`Lỗi khi cập nhật InteractXSettings: ${error.message}`);
      return null;
    }
  }
}

export const interactXSettingsService = new InteractXSettingsService();
export default interactXSettingsService;
