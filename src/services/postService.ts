import { ObjectId } from "mongodb";
import { getCollection } from "../utils/mongoDb";
import { logger } from "../utils/logger";
import { IXPost } from "../utils/interfaces";
import interactXSettingsService from "./interactXSettingsService";

/**
 * Service quản lý các bài đăng (posts) trong hệ thống
 */
class PostService {
  /**
   * Tạo hoặc cập nhật nhiều bài đăng cùng lúc
   * @param postsData Mảng dữ liệu bài đăng cần lưu
   * @returns Mảng các bài đăng đã được lưu
   */
  async createOrUpdatePosts(postsData: Partial<IXPost>[]): Promise<IXPost[]> {
    const results: IXPost[] = [];
    for (const postData of postsData) {
      try {
        const post = await this.createOrUpdatePost(postData);
        results.push(post);
      } catch (error: any) {
        logger.error(
          `Lỗi khi lưu/cập nhật bài đăng (postId: ${postData.postId}): ${error.message}`
        );
      }
    }
    return results;
  }
  private readonly collectionName = "interactXTgPosts";

  /**
   * Tạo hoặc cập nhật bài đăng
   * @param postData Dữ liệu bài đăng cần lưu
   * @returns Bài đăng đã được lưu
   */
  async createOrUpdatePost(postData: Partial<IXPost>): Promise<IXPost> {
    try {
      const collection = getCollection<IXPost>(this.collectionName);
      const settings = await interactXSettingsService.getSettings();
      console.log("settings: ", settings);

      // Kiểm tra xem bài đăng đã tồn tại chưa bằng _id
      const existingPost = postData._id
        ? await collection.findOne({ _id: postData._id })
        : null;

      if (existingPost) {
        // Cập nhật bài đăng hiện có
        const updateData: Partial<IXPost> = {
          ...postData,
          updatedAt: new Date(),
        };

        // Xóa các trường không định nghĩa để tránh ghi đè undefined
        Object.keys(updateData).forEach((key) => {
          if (updateData[key as keyof IXPost] === undefined) {
            delete updateData[key as keyof IXPost];
          }
        });

        await collection.updateOne(
          { postId: postData.postId },
          { $set: updateData }
        );

        // Lấy dữ liệu sau khi cập nhật
        const updatedPost = await collection.findOne({
          postId: postData.postId,
        });
        return updatedPost as IXPost;
      } else {
        // Tạo bài đăng mới
        const newPost: IXPost = {
          postId: postData.postId || "",
          postUrl: postData.postUrl || "",
          username: postData.username || "",
          pendingTaskCount: 0,
          interactionCount: postData.interactionCount || 0,
          requiredInteractionCount:
            postData.type == "admin"
              ? settings?.minimumLinkForAdmin
              : settings?.minimumLinksForTask,
          type: postData.type || "member",
          telegramUserId: postData.telegramUserId || null, // Thêm telegramUserId, mặc định là null nếu không được cung cấp
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result = await collection.insertOne(newPost);
        return { ...newPost, _id: result.insertedId };
      }
    } catch (error: any) {
      logger.error(`Lỗi khi lưu/cập nhật bài đăng: ${error.message}`);
      throw new Error(`Không thể lưu/cập nhật bài đăng: ${error.message}`);
    }
  }

  /**
   * Lấy bài đăng theo ID
   * @param postId ID của bài đăng
   * @returns Bài đăng nếu tìm thấy, hoặc null nếu không tìm thấy
   */
  async getPostById(postId: string): Promise<IXPost | null> {
    try {
      const collection = getCollection<IXPost>(this.collectionName);
      return await collection.findOne({ postId });
    } catch (error: any) {
      logger.error(`Lỗi khi lấy bài đăng theo ID: ${error.message}`);
      return null;
    }
  }

  /**
   * Lấy tất cả các bài đăng của một username
   * @param username Username cần lấy bài đăng
   * @returns Danh sách các bài đăng
   */
  async getPostsByUsername(username: string): Promise<IXPost[]> {
    try {
      const collection = getCollection<IXPost>(this.collectionName);
      return await collection
        .find({ username })
        .sort({ createdAt: -1 })
        .toArray();
    } catch (error: any) {
      logger.error(`Lỗi khi lấy bài đăng theo username: ${error.message}`);
      return [];
    }
  }

  /**
   * Tăng số lượt tương tác cho bài đăng
   * @param postId ID của bài đăng
   * @param incrementBy Số lượng tăng (mặc định là 1)
   * @returns Bài đăng sau khi cập nhật
   */
  async incrementInteractionCount(
    postId: string,
    incrementBy: number = 1
  ): Promise<IXPost | null> {
    try {
      const collection = getCollection<IXPost>(this.collectionName);

      await collection.updateOne(
        { postId },
        {
          $inc: { interactionCount: incrementBy },
          $set: { updatedAt: new Date() },
        }
      );

      return await this.getPostById(postId);
    } catch (error: any) {
      logger.error(`Lỗi khi tăng lượt tương tác: ${error.message}`);
      return null;
    }
  }
}

// Export instance của service để sử dụng trong toàn ứng dụng
export const postService = new PostService();
export default postService;
