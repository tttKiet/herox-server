import "dotenv/config";
import { ObjectId } from "mongodb";
import { logger } from "../utils/logger";
import { getCollection } from "../utils/mongoDb";
import {
  ITask,
  ITaskLink,
  IXPost,
  ITelegramUser,
  IInteractXSettings,
  IUserCredit,
} from "../utils/interfaces";
import SettingsManager from "./SettingsManager";

/**
 * Lớp quản lý nhiệm vụ tương tác
 */
class TaskManager {
  private settingsManager: SettingsManager;

  constructor() {
    this.settingsManager = new SettingsManager();
  }

  /**
   * Tạo nhiệm vụ mới cho người dùng
   * @param telegramUserId ID người dùng Telegram
   * @param xUsername Tên người dùng X sẽ thực hiện nhiệm vụ
   * @returns Thông tin nhiệm vụ đã tạo hoặc null nếu có lỗi
   */
  async createTask(
    telegramUserId: string,
    xUsername: string
  ): Promise<{
    task: ITask | null;
    links: ITaskLink[];
    success: boolean;
    message?: string;
  }> {
    try {
      // Lấy cài đặt hiện tại
      const settings = await this.settingsManager.getSettings();
      if (!settings) {
        return {
          task: null,
          links: [],
          success: false,
          message: "Không tìm thấy cài đặt hệ thống",
        };
      }

      // Kiểm tra nếu người dùng đã có nhiệm vụ chưa hoàn thành
      const existingTask = await this.getUncompletedTask(
        telegramUserId,
        xUsername
      );
      if (existingTask && existingTask._id) {
        const taskLinks = await this.getTaskLinks(existingTask._id.toString());
        return {
          task: existingTask,
          links: taskLinks,
          success: true,
          message: "Người dùng đã có nhiệm vụ chưa hoàn thành",
        };
      }

      // Kiểm tra số lượng link khả dụng trong hệ thống trước khi tạo nhiệm vụ
      const availableMemberLinks = await this.getAvailableMemberLinksCount(
        settings.requiredInteractionsPerLink
      );
      const availableAdminLinks = await this.getAvailableAdminLinksCount();

      // Tính số link khả dụng cho nhiệm vụ
      let memberLinksForTask = Math.min(
        availableMemberLinks,
        settings.minimumLinksForTask
      );
      let memberLinkShortage =
        settings.minimumLinksForTask - memberLinksForTask;

      // Số link admin cần để bù đắp thiếu hụt từ member links
      let adminLinksForMinimum =
        settings.additionalLinkSource === "admin"
          ? Math.min(memberLinkShortage, availableAdminLinks)
          : 0;

      // Số link admin còn lại cho phần additionalLinks sau khi đã sử dụng cho minimumLinks
      let remainingAdminLinks =
        settings.additionalLinkSource === "admin"
          ? Math.min(
              availableAdminLinks - adminLinksForMinimum,
              settings.additionalLinks
            )
          : 0;

      // Tổng số link thực tế có thể sử dụng
      const totalAvailableTaskLinks =
        memberLinksForTask + adminLinksForMinimum + remainingAdminLinks;

      // Tổng số link được yêu cầu theo cài đặt
      const totalRequiredLinks =
        settings.minimumLinksForTask + settings.additionalLinks;

      logger.info(
        `Số link hiện có: ${
          availableMemberLinks + availableAdminLinks
        } (Member: ${availableMemberLinks}, Admin: ${availableAdminLinks})`
      );
      logger.info(
        `Phân bổ: ${memberLinksForTask} member links + ${adminLinksForMinimum} admin bổ sung cho minimum + ${remainingAdminLinks} admin cho additional`
      );
      logger.info(
        `Tổng link có thể dùng: ${totalAvailableTaskLinks}/${totalRequiredLinks} theo yêu cầu (Minimum: ${settings.minimumLinksForTask}, Additional: ${settings.additionalLinks})`
      );

      // Nếu không đủ link tối thiểu (minimumLinks), thông báo cho người dùng
      if (
        memberLinksForTask + adminLinksForMinimum <
        settings.minimumLinksForTask
      ) {
        return {
          task: null,
          links: [],
          success: false,
          message: `Hiện tại hệ thống không có đủ link để tạo nhiệm vụ mới (Có ${
            memberLinksForTask + adminLinksForMinimum
          }/${settings.minimumLinksForTask} link). Vui lòng thử lại sau.`,
        };
      }

      // Lấy số thứ tự nhiệm vụ mới
      const taskNumber = await this.getNextTaskNumber(telegramUserId);

      // Tính toán số link bổ sung thực tế có thể sử dụng
      const usableAdditionalLinks = Math.max(
        0,
        Math.min(
          settings.additionalLinks,
          totalAvailableTaskLinks - settings.minimumLinksForTask
        )
      );

      // Tính toán tổng số link thực tế khả dụng
      const actualTotalLinks =
        settings.minimumLinksForTask + usableAdditionalLinks;

      logger.info(
        `Link sẽ sử dụng: ${settings.minimumLinksForTask} minimum + ${usableAdditionalLinks} additional = ${actualTotalLinks} links`
      );

      // Tạo nhiệm vụ mới
      const newTask: ITask = {
        telegramUserId,
        xUsername,
        taskNumber,
        minimumLinksForTask: settings.minimumLinksForTask,
        totalLinks: actualTotalLinks, // Sử dụng số link thực tế khả dụng
        completedLinks: 0,
        status: "todo",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Lưu nhiệm vụ vào CSDL
      const tasksCollection = getCollection<ITask>("interactXTasks");
      const result = await tasksCollection.insertOne(newTask);

      if (!result.insertedId) {
        return {
          task: null,
          links: [],
          success: false,
          message: "Không thể tạo nhiệm vụ mới",
        };
      }

      // Tạo task ID từ kết quả insert
      const taskId = result.insertedId;

      // Phân bổ các link cho nhiệm vụ này
      const links = await this.assignLinksToTask(
        taskId,
        settings.minimumLinksForTask,
        usableAdditionalLinks, // Sử dụng số link bổ sung thực tế có thể sử dụng
        settings.selectionMethod,
        settings.additionalLinkSource,
        settings.requiredInteractionsPerLink,
        telegramUserId,
        xUsername
      );

      if (links.length === 0) {
        // Nếu không có link nào được phân bổ, xóa nhiệm vụ
        await tasksCollection.deleteOne({ _id: taskId });
        return {
          task: null,
          links: [],
          success: false,
          message: "Không có đủ link để phân bổ cho nhiệm vụ",
        };
      }

      // Không cần kiểm tra số lượng link nữa vì đã kiểm tra trước khi tạo task

      logger.success(`Đã tạo nhiệm vụ mới (${taskNumber}) cho ${xUsername}`);

      // Cập nhật totalLinks dựa trên số lượng link thực tế được phân bổ
      await tasksCollection.updateOne(
        { _id: taskId },
        { $set: { totalLinks: links.length } }
      );

      // Lấy nhiệm vụ đã tạo với ID
      const createdTask = await tasksCollection.findOne({ _id: taskId });

      return {
        task: createdTask || null,
        links,
        success: true,
        message: "Đã tạo nhiệm vụ mới thành công",
      };
    } catch (error) {
      logger.error(`Lỗi khi tạo nhiệm vụ: ${error}`);
      return {
        task: null,
        links: [],
        success: false,
        message: `Lỗi khi tạo nhiệm vụ: ${error}`,
      };
    }
  }

  /**
   * Lấy số thứ tự cho nhiệm vụ tiếp theo của người dùng
   */
  private async getNextTaskNumber(telegramUserId: string): Promise<number> {
    try {
      const tasksCollection = getCollection<ITask>("interactXTasks");

      // Tìm nhiệm vụ gần đây nhất của người dùng
      const latestTask = await tasksCollection.findOne(
        { telegramUserId },
        { sort: { taskNumber: -1 } }
      );

      // Nếu không có nhiệm vụ nào trước đó, trả về 1
      if (!latestTask) {
        return 1;
      }

      // Nếu có, trả về số thứ tự tiếp theo
      return latestTask.taskNumber + 1;
    } catch (error) {
      logger.error(`Lỗi khi lấy số thứ tự nhiệm vụ: ${error}`);
      return 1;
    }
  }

  /**
   * Lấy nhiệm vụ chưa hoàn thành của người dùng
   */
  async getUncompletedTask(
    telegramUserId: string,
    xUsername: string
  ): Promise<ITask | null> {
    try {
      const tasksCollection = getCollection<ITask>("interactXTasks");

      // Tìm nhiệm vụ có trạng thái "todo"
      return await tasksCollection.findOne({
        telegramUserId,
        xUsername,
        status: "todo",
      });
    } catch (error) {
      logger.error(`Lỗi khi lấy nhiệm vụ chưa hoàn thành: ${error}`);
      return null;
    }
  }

  /**
   * Lấy các link thuộc về một nhiệm vụ
   */
  async getTaskLinks(taskId: string): Promise<ITaskLink[]> {
    try {
      const taskLinksCollection =
        getCollection<ITaskLink>("interactXTaskLinks");

      // Chuyển đổi taskId từ string sang ObjectId
      const taskObjectId = new ObjectId(taskId);

      // Tìm tất cả các link thuộc về nhiệm vụ này
      return await taskLinksCollection.find({ taskId: taskObjectId }).toArray();
    } catch (error) {
      logger.error(`Lỗi khi lấy danh sách link nhiệm vụ: ${error}`);
      return [];
    }
  }

  /**
   * Phân bổ các link cho nhiệm vụ
   * @param taskId ID của nhiệm vụ
   * @param minimumLinks Số lượng link tối thiểu cần thiết cho nhiệm vụ
   * @param additionalLinks Số lượng link bổ sung có thể sử dụng (đã được điều chỉnh dựa trên số link thực tế có sẵn)
   * @param selectionMethod Phương thức chọn link (newest, oldest, random, least-interactions)
   * @param additionalLinkSource Nguồn link bổ sung (admin hoặc member)
   * @param requiredInteractions Số lượng tương tác cần thiết cho mỗi link
   * @param telegramUserId ID người dùng Telegram để kiểm tra tương tác trước đó
   * @param xUsername Tên người dùng X để kiểm tra tương tác trước đó
   * @returns Danh sách các link đã được phân bổ cho nhiệm vụ
   */
  private async assignLinksToTask(
    taskId: ObjectId,
    minimumLinks: number,
    additionalLinks: number,
    selectionMethod: string,
    additionalLinkSource: string,
    requiredInteractions: number,
    telegramUserId: string,
    xUsername: string
  ): Promise<ITaskLink[]> {
    try {
      // Khởi tạo Set để theo dõi các postId đã được sử dụng
      const usedPostIds = new Set<string>();

      // Lấy các link để phân bổ, loại bỏ các link người dùng đã tương tác
      const memberLinks = await this.getEligibleMemberLinks(
        minimumLinks,
        selectionMethod,
        requiredInteractions,
        telegramUserId,
        xUsername
      );

      // Thêm postId của các member links vào danh sách đã sử dụng
      memberLinks.forEach((link) => usedPostIds.add(link.postId));

      // Tính toán số link còn thiếu từ thành viên
      const memberLinksShortage = Math.max(
        0,
        minimumLinks - memberLinks.length
      );

      // Nếu thiếu link từ thành viên, bổ sung bằng link admin nếu cần
      let extraAdminLinks: IXPost[] = [];
      if (memberLinksShortage > 0 && additionalLinkSource === "admin") {
        extraAdminLinks = await this.getExtraAdminLinks(
          memberLinksShortage,
          selectionMethod,
          usedPostIds,
          telegramUserId,
          xUsername
        );
      }

      // Thêm postId của các extra admin links vào danh sách đã sử dụng
      extraAdminLinks.forEach((link) => usedPostIds.add(link.postId));

      // Tính toán số link admin bổ sung có thể thêm vào (không trùng với link đã sử dụng)
      const remainingAdditionalLinksCount = Math.min(
        additionalLinks,
        // Số link admin có thể sử dụng = số link admin thực tế trừ đi số đã dùng để bổ sung cho member
        (await this.getAvailableAdminLinksCount()) - extraAdminLinks.length
      );

      // Lấy admin links cho phần additionalLinks, đảm bảo không trùng với extraAdminLinks
      const adminLinks = await this.getEligibleAdminLinks(
        remainingAdditionalLinksCount,
        selectionMethod,
        usedPostIds, // Truyền danh sách postId đã sử dụng để loại bỏ
        telegramUserId,
        xUsername
      );

      logger.info(
        `Phân bổ link: ${memberLinks.length} member links + ${
          extraAdminLinks.length
        } extra admin links + ${
          adminLinks.length
        } additional admin links (Tổng: ${
          memberLinks.length + extraAdminLinks.length + adminLinks.length
        })`
      );

      // Kết hợp các link
      const allLinks = [...memberLinks, ...extraAdminLinks, ...adminLinks];

      if (allLinks.length === 0) {
        logger.warn("Không có link nào để phân bổ cho nhiệm vụ");
        return [];
      }

      // Kiểm tra nếu số lượng link khả dụng không đủ yêu cầu tối thiểu
      if (allLinks.length < minimumLinks) {
        logger.warn(
          `Không đủ link để tạo nhiệm vụ: ${allLinks.length}/${minimumLinks}`
        );
        return [];
      }

      // Do đã kiểm tra đủ link trước khi gọi hàm này, nên không cần điều chỉnh nữa

      // Tạo các taskLink trong CSDL
      const taskLinks: ITaskLink[] = [];
      const taskLinksCollection =
        getCollection<ITaskLink>("interactXTaskLinks");

      for (const link of allLinks) {
        const taskLink: ITaskLink = {
          taskId,
          postId: link.postId,
          postUrl: link.postUrl,
          type: link.type || "member", // Sử dụng loại mặc định nếu không có
          interactionCount: 0, // Ban đầu chưa có tương tác nào
          requiredInteractions, // Số lần tương tác cần đạt được
          status: "pending", // Trạng thái ban đầu là đang chờ
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await taskLinksCollection.insertOne(taskLink);
        taskLinks.push(taskLink);
      }

      // Cập nhật totalLinks trong bảng interactXTasks
      const tasksCollection = getCollection<ITask>("interactXTasks");
      await tasksCollection.updateOne(
        { _id: taskId },
        { $set: { totalLinks: taskLinks.length } }
      );

      logger.success(`Đã phân bổ ${taskLinks.length} link cho nhiệm vụ`);
      return taskLinks;
    } catch (error) {
      logger.error(`Lỗi khi phân bổ link cho nhiệm vụ: ${error}`);
      return [];
    }
  }

  /**
   * Lấy các link từ thành viên chưa đủ tương tác
   */
  private async getEligibleMemberLinks(
    count: number,
    selectionMethod: string,
    requiredInteractions: number,
    telegramUserId: string,
    xUsername: string
  ): Promise<IXPost[]> {
    try {
      const postsCollection = getCollection<IXPost>("interactXTgPosts");
      const interactionsCollection =
        getCollection<ITaskLink>("interactXTaskLinks");

      // Lấy tất cả các post từ thành viên với interactionCount < requiredInteractions
      const memberPosts = await postsCollection
        .find({
          type: "member",
          interactionCount: { $lt: requiredInteractions },
        })
        .toArray();

      // Lấy danh sách các postId mà người dùng đã tương tác trước đó
      const tasksCollection = getCollection<ITask>("interactXTasks");

      // Tìm tất cả các nhiệm vụ của người dùng với username này
      const userTasks = await tasksCollection
        .find({
          telegramUserId,
          xUsername,
        })
        .toArray();

      // Lấy tất cả các task ID của người dùng
      const userTaskIds = userTasks.map((task) => task._id);

      // Tìm tất cả các link mà người dùng đã tương tác trước đó
      const previousInteractions = await interactionsCollection
        .find({
          taskId: { $in: userTaskIds },
        })
        .toArray();

      // Tạo Set các postId mà người dùng đã tương tác
      const previouslyInteractedPostIds = new Set<string>(
        previousInteractions.map((interaction) => interaction.postId)
      );

      // Lọc các bài đăng chưa đủ tương tác và chưa được người dùng tương tác
      const eligiblePosts = memberPosts.filter(
        (post) => !previouslyInteractedPostIds.has(post.postId)
      );

      logger.info(
        `Tìm thấy ${memberPosts.length} member links khả dụng, ${previouslyInteractedPostIds.size} đã tương tác trước đó, còn lại ${eligiblePosts.length} có thể sử dụng`
      );

      // Sắp xếp theo phương thức đã chọn
      let sortedPosts: IXPost[] = [];

      if (selectionMethod === "newest") {
        sortedPosts = eligiblePosts.sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
        );
      } else if (selectionMethod === "oldest") {
        sortedPosts = eligiblePosts.sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
        );
      } else if (selectionMethod === "random") {
        sortedPosts = this.shuffleArray([...eligiblePosts]);
      } else if (selectionMethod === "least-interactions") {
        // Ưu tiên link chưa đủ tương tác, sắp xếp interactionCount tăng dần
        sortedPosts = eligiblePosts.sort(
          (a, b) => (a.interactionCount || 0) - (b.interactionCount || 0)
        );
      } else {
        // Mặc định là oldest
        sortedPosts = eligiblePosts.sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
        );
      }

      // Lấy số lượng cần thiết
      return sortedPosts.slice(0, count);
    } catch (error) {
      logger.error(`Lỗi khi lấy link từ thành viên: ${error}`);
      return [];
    }
  }

  /**
   * Lấy các link từ admin
   * @param count Số lượng link cần lấy
   * @param selectionMethod Phương thức lựa chọn link (newest, oldest, random, least-interactions)
   * @param excludePostIds Set các postId cần loại trừ để tránh trùng lặp
   * @param telegramUserId ID người dùng Telegram để kiểm tra tương tác trước đó
   * @param xUsername Tên người dùng X để kiểm tra tương tác trước đó
   */
  private async getEligibleAdminLinks(
    count: number,
    selectionMethod: string,
    excludePostIds: Set<string> = new Set(),
    telegramUserId?: string,
    xUsername?: string
  ): Promise<IXPost[]> {
    try {
      const postsCollection = getCollection<IXPost>("interactXTgPosts");

      // Xây dựng query để lọc các post từ admin và loại trừ các postId đã sử dụng
      const query: any = { type: "admin" };

      // Nếu có telegramUserId và xUsername, loại bỏ các link người dùng đã tương tác
      let previouslyInteractedPostIds = new Set<string>();
      if (telegramUserId && xUsername) {
        const tasksCollection = getCollection<ITask>("interactXTasks");
        const interactionsCollection =
          getCollection<ITaskLink>("interactXTaskLinks");

        // Tìm tất cả các nhiệm vụ của người dùng với username này
        const userTasks = await tasksCollection
          .find({
            telegramUserId,
            xUsername,
          })
          .toArray();

        // Lấy tất cả các task ID của người dùng
        const userTaskIds = userTasks.map((task) => task._id);

        if (userTaskIds.length > 0) {
          // Tìm tất cả các link mà người dùng đã tương tác trước đó
          const previousInteractions = await interactionsCollection
            .find({
              taskId: { $in: userTaskIds },
            })
            .toArray();

          // Thêm vào Set các postId mà người dùng đã tương tác
          previousInteractions.forEach((interaction) =>
            previouslyInteractedPostIds.add(interaction.postId)
          );

          logger.info(
            `Người dùng ${xUsername} đã tương tác với ${previouslyInteractedPostIds.size} admin links trước đó`
          );
        }
      }

      // Kết hợp excludePostIds với previouslyInteractedPostIds
      const allExcludedPostIds = new Set<string>([
        ...Array.from(excludePostIds),
        ...Array.from(previouslyInteractedPostIds),
      ]);

      // Nếu có excludePostIds, loại bỏ các postId đã có
      if (allExcludedPostIds.size > 0) {
        query.postId = { $nin: Array.from(allExcludedPostIds) };
      }

      // Lấy các post từ admin
      let adminPosts: IXPost[] = [];

      if (selectionMethod === "newest") {
        adminPosts = await postsCollection
          .find(query)
          .sort({ createdAt: -1 })
          .limit(count)
          .toArray();
      } else if (selectionMethod === "oldest") {
        adminPosts = await postsCollection
          .find(query)
          .sort({ createdAt: 1 })
          .limit(count)
          .toArray();
      } else if (selectionMethod === "random") {
        const allAdminPosts = await postsCollection.find(query).toArray();
        adminPosts = this.shuffleArray(allAdminPosts).slice(0, count);
      } else if (selectionMethod === "least-interactions") {
        // Lấy tất cả các post admin và sắp xếp theo interactionCount tăng dần
        const allAdminPosts = await postsCollection.find(query).toArray();
        adminPosts = allAdminPosts
          .sort((a, b) => (a.interactionCount || 0) - (b.interactionCount || 0))
          .slice(0, count);
      } else {
        // Mặc định là oldest
        adminPosts = await postsCollection
          .find(query)
          .sort({ createdAt: 1 })
          .limit(count)
          .toArray();
      }

      return adminPosts;
    } catch (error) {
      logger.error(`Lỗi khi lấy link từ admin: ${error}`);
      return [];
    }
  }

  /**
   * Lấy thêm link từ admin khi thiếu link từ thành viên
   * @param count Số lượng link cần lấy
   * @param selectionMethod Phương thức lựa chọn link
   * @param excludePostIds Set các postId cần loại trừ để tránh trùng lặp
   * @param telegramUserId ID người dùng Telegram để kiểm tra tương tác trước đó
   * @param xUsername Tên người dùng X để kiểm tra tương tác trước đó
   */
  private async getExtraAdminLinks(
    count: number,
    selectionMethod: string,
    excludePostIds: Set<string> = new Set(),
    telegramUserId?: string,
    xUsername?: string
  ): Promise<IXPost[]> {
    return this.getEligibleAdminLinks(
      count,
      selectionMethod,
      excludePostIds,
      telegramUserId,
      xUsername
    );
  }

  /**
   * Đếm số lượng link của thành viên có sẵn trong hệ thống
   * @param requiredInteractions Số lượng tương tác yêu cầu cho mỗi link
   * @returns Số lượng link khả dụng
   */
  private async getAvailableMemberLinksCount(
    requiredInteractions: number
  ): Promise<number> {
    try {
      const postsCollection = getCollection<IXPost>("interactXTgPosts");

      // Đếm số lượng post từ thành viên với interactionCount < requiredInteractions
      const count = await postsCollection.countDocuments({
        type: "member",
        interactionCount: { $lt: requiredInteractions },
      });

      return count;
    } catch (error) {
      logger.error(`Lỗi khi đếm số link thành viên khả dụng: ${error}`);
      return 0;
    }
  }

  /**
   * Đếm số lượng link của admin có sẵn trong hệ thống
   * @returns Số lượng link khả dụng
   */
  private async getAvailableAdminLinksCount(): Promise<number> {
    try {
      const postsCollection = getCollection<IXPost>("interactXTgPosts");

      // Đếm số lượng post từ admin
      const count = await postsCollection.countDocuments({
        type: "admin",
      });

      return count;
    } catch (error) {
      logger.error(`Lỗi khi đếm số link admin khả dụng: ${error}`);
      return 0;
    }
  }

  /**
   * Lấy thống kê tương tác cho các bài đăng
   */
  private async getInteractionStatistics(): Promise<
    Record<string, { count: number }>
  > {
    try {
      const taskLinksCollection =
        getCollection<ITaskLink>("interactXTaskLinks");

      // Lấy tất cả task link
      const allTaskLinks = await taskLinksCollection.find({}).toArray();

      // Thống kê số lần tương tác cho mỗi bài đăng
      const stats: Record<string, { count: number }> = {};

      for (const link of allTaskLinks) {
        if (!stats[link.postId]) {
          stats[link.postId] = { count: 0 };
        }

        // Nếu link đã có tương tác, cộng vào thống kê
        if (link.interactionCount > 0) {
          stats[link.postId].count += link.interactionCount;
        }
      }

      return stats;
    } catch (error) {
      logger.error(`Lỗi khi lấy thống kê tương tác: ${error}`);
      return {};
    }
  }

  /**
   * Trộn ngẫu nhiên một mảng (thuật toán Fisher-Yates)
   */
  private shuffleArray<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  /**
   * Cập nhật trạng thái tương tác của một link
   */
  async updateTaskLinkInteraction(
    taskId: string,
    postId: string,
    completed: boolean = true
  ): Promise<boolean> {
    try {
      const taskLinksCollection =
        getCollection<ITaskLink>("interactXTaskLinks");
      const tasksCollection = getCollection<ITask>("interactXTasks");
      const postsCollection = getCollection<IXPost>("interactXTgPosts");

      // Tìm task link cần cập nhật
      const taskObjectId = new ObjectId(taskId);
      const taskLink = await taskLinksCollection.findOne({
        taskId: taskObjectId,
        postId,
      });

      if (!taskLink) {
        logger.warn(`Không tìm thấy link ${postId} trong nhiệm vụ ${taskId}`);
        return false;
      }

      // Cập nhật trạng thái tương tác trong task link
      if (completed) {
        // Kiểm tra xem link có chuyển từ pending sang completed không
        const newInteractionCount = taskLink.interactionCount + 1;
        const newStatus =
          newInteractionCount >= taskLink.requiredInteractions
            ? "completed"
            : "pending";
        const statusChanged =
          taskLink.status === "pending" && newStatus === "completed";

        // Tăng interactionCount trong bảng interactXTaskLinks
        await taskLinksCollection.updateOne(
          { taskId: taskObjectId, postId },
          {
            $set: {
              interactionCount: newInteractionCount,
              status: newStatus,
              updatedAt: new Date(),
            },
          }
        );

        // Chỉ tăng interactionCount trong bảng interactXTgPosts khi link được chuyển từ pending sang completed
        if (statusChanged) {
          await postsCollection.updateOne(
            { postId },
            {
              $inc: { interactionCount: 1 },
              $set: { updatedAt: new Date() },
            }
          );
          logger.info(
            `Đã tăng số tương tác cho bài đăng ${postId} (Link chuyển từ pending sang completed)`
          );
        } else {
          logger.info(
            `Đã cập nhật interactionCount cho taskLink ${postId} (Link vẫn giữ trạng thái ${newStatus})`
          );
        }
      }

      // Đếm số link đã hoàn thành trong nhiệm vụ
      const completedLinks = await taskLinksCollection.countDocuments({
        taskId: taskObjectId,
        status: "completed",
      });

      // Lấy thông tin nhiệm vụ
      const task = await tasksCollection.findOne({ _id: taskObjectId });

      if (!task) {
        logger.warn(`Không tìm thấy nhiệm vụ ${taskId}`);
        return false;
      }

      // Kiểm tra xem đã hoàn thành đủ số link tối thiểu chưa
      const isTaskCompleted = completedLinks >= task.minimumLinksForTask;

      // Cập nhật trạng thái nhiệm vụ
      await tasksCollection.updateOne(
        { _id: taskObjectId },
        {
          $set: {
            completedLinks,
            status: isTaskCompleted ? "done" : "todo",
            updatedAt: new Date(),
          },
        }
      );

      // Đếm tổng số link thực tế của task
      const totalLinks = await taskLinksCollection.countDocuments({
        taskId: taskObjectId,
      });

      // Cập nhật totalLinks trong task nếu khác với số lượng thực tế
      if (task.totalLinks !== totalLinks) {
        await tasksCollection.updateOne(
          { _id: taskObjectId },
          { $set: { totalLinks: totalLinks } }
        );
      }

      // Kiểm tra nếu task vừa chuyển trạng thái từ "todo" sang "done" thì cập nhật credits
      const taskStatusChanged = isTaskCompleted && task.status === "todo";

      if (taskStatusChanged) {
        // Cập nhật credits khi nhiệm vụ hoàn thành
        await this.updateUserCreditsOnTaskCompletion(task);

        logger.success(
          `Nhiệm vụ ${taskId} đã hoàn thành với ${completedLinks}/${task.minimumLinksForTask} link (Tổng số thực tế: ${totalLinks})`
        );
      } else {
        logger.info(
          `Đã cập nhật tiến độ nhiệm vụ ${taskId}: ${completedLinks}/${task.minimumLinksForTask} link (Tổng số thực tế: ${totalLinks})`
        );
      }

      return true;
    } catch (error) {
      logger.error(`Lỗi khi cập nhật tương tác: ${error}`);
      return false;
    }
  }

  /**
   * Lấy thông tin chi tiết về nhiệm vụ cho người dùng
   */
  async getTaskDetails(
    telegramUserId: string,
    xUsername: string
  ): Promise<{
    task: ITask | null;
    links: ITaskLink[];
    pendingLinks: number;
    completedLinks: number;
    success: boolean;
    message?: string;
  }> {
    try {
      // Lấy nhiệm vụ hiện tại của người dùng

      console.log({ telegramUserId, xUsername });

      const task = await this.getUncompletedTask(telegramUserId, xUsername);

      if (!task) {
        return {
          task: null,
          links: [],
          pendingLinks: 0,
          completedLinks: 0,
          success: false,
          message: "Không tìm thấy nhiệm vụ nào cho người dùng này",
        };
      }

      // Lấy danh sách link của nhiệm vụ
      const links = task._id
        ? await this.getTaskLinks(task._id.toString())
        : [];

      console.log("links: ", links);

      // Đếm số link đã hoàn thành và đang chờ
      const pendingLinks = links.filter(
        (link) => link.status === "pending"
      ).length;
      const completedLinks = links.filter(
        (link) => link.status === "completed"
      ).length;

      return {
        task,
        links,
        pendingLinks,
        completedLinks,
        success: true,
        message:
          task.status === "done"
            ? "Nhiệm vụ đã hoàn thành"
            : "Nhiệm vụ đang trong tiến trình",
      };
    } catch (error) {
      logger.error(`Lỗi khi lấy chi tiết nhiệm vụ: ${error}`);
      return {
        task: null,
        links: [],
        pendingLinks: 0,
        completedLinks: 0,
        success: false,
        message: `Lỗi khi lấy chi tiết nhiệm vụ: ${error}`,
      };
    }
  }

  /**
   * Save user links to the system after completing a task
   * @param telegramUserId Telegram user ID
   * @param xUsername X username
   * @param links Array of post links
   * @returns Status of the operation
   */
  async saveUserLinks(
    telegramUserId: string,
    xUsername: string,
    links: string[]
  ): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      // Kiểm tra credits của người dùng
      const creditsCollection = getCollection<IUserCredit>(
        "interactXUserCredits"
      );
      const userCredit = await creditsCollection.findOne({
        telegramUserId,
        xUsername,
      });

      // Nếu không có credit nào, kiểm tra xem người dùng có hoàn thành task nào chưa
      if (!userCredit || userCredit.availableCredits <= 0) {
        // Kiểm tra xem có nhiệm vụ đã hoàn thành không để tạo credit nếu cần
        const taskDetails = await this.getTaskDetails(
          telegramUserId,
          xUsername
        );

        if (!taskDetails.success || !taskDetails.task) {
          return {
            success: false,
            message: `No credits available for @${xUsername}. Complete tasks to earn credits.`,
          };
        }
        if (taskDetails.task.status !== "done") {
          return {
            success: false,
            message:
              "You need to complete your current task before posting links",
          };
        }

        // Nếu có nhiệm vụ đã hoàn thành mà không có credit, cập nhật credit
        if (!userCredit && taskDetails.task._id) {
          await this.updateUserCreditsOnTaskCompletion(taskDetails.task);

          // Kiểm tra lại credit sau khi cập nhật
          const updatedCredit = await creditsCollection.findOne({
            telegramUserId,
            xUsername,
          });

          if (!updatedCredit || updatedCredit.availableCredits <= 0) {
            return {
              success: false,
              message: "Error updating your credits. Please try again later.",
            };
          }
        } else {
          return {
            success: false,
            message: `No credits available for @${xUsername}. Complete more tasks to earn credits.`,
          };
        }
      }

      // Kiểm tra số lượng link được phép đăng
      if (links.length > userCredit!.availableCredits) {
        return {
          success: false,
          message: `You can only post ${
            userCredit!.availableCredits
          } links with your current credits.`,
        };
      }

      // Save links to database
      const postsCollection = getCollection<IXPost>("interactXTgPosts");
      const savedLinks: string[] = [];

      for (const link of links) {
        // Generate unique post ID
        const postId = new ObjectId().toString();

        // Create post object with maxInteractionCount from userCredit
        const post: IXPost = {
          postId,
          username: xUsername, // Use username field instead of xUsername
          postUrl: link,
          type: "member", // Type is member since it's from a user
          interactionCount: 0, // Initialize interaction counter to 0
          maxInteractionCount: userCredit?.lastMinimumLinksForTask, // Use lastMinimumLinksForTask from credits
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Save to database
        await postsCollection.insertOne(post);
        savedLinks.push(postId);
        logger.success(`Saved post ${postId} for user ${xUsername}`);
      }

      // Giảm credit đã sử dụng
      await creditsCollection.updateOne(
        { telegramUserId, xUsername },
        {
          $inc: {
            availableCredits: -links.length,
            totalUsedCredits: links.length,
          },
          $set: { updatedAt: new Date() },
        }
      );

      return {
        success: true,
        message: `Successfully saved ${links.length} links. You have ${
          userCredit!.availableCredits - links.length
        } credits left.`,
      };
    } catch (error) {
      logger.error(`Error saving user links: ${error}`);
      return {
        success: false,
        message: `Error saving links: ${error}`,
      };
    }
  }

  /**
   * Get user credit information
   * @param telegramUserId Telegram user ID
   * @param xUsername X username
   * @returns Credit information for the user
   */
  async getUserCreditInfo(
    telegramUserId: string,
    xUsername: string
  ): Promise<{
    availableCredits: number;
    totalEarnedCredits: number;
    totalUsedCredits: number;
    lastMinimumLinksForTask: number;
    success: boolean;
    message?: string;
  }> {
    try {
      const creditsCollection = getCollection<IUserCredit>(
        "interactXUserCredits"
      );

      const userCredit = await creditsCollection.findOne({
        telegramUserId,
        xUsername,
      });

      console.log("userCredit: ", userCredit);

      if (!userCredit) {
        return {
          availableCredits: 0,
          totalEarnedCredits: 0,
          totalUsedCredits: 0,
          lastMinimumLinksForTask: 0,
          success: false,
          message: "No credit information found for this user",
        };
      }

      return {
        availableCredits: userCredit.availableCredits,
        totalEarnedCredits: userCredit.totalEarnedCredits,
        totalUsedCredits: userCredit.totalUsedCredits,
        lastMinimumLinksForTask: userCredit.lastMinimumLinksForTask || 0,
        success: true,
      };
    } catch (error) {
      logger.error(`Error fetching credit information: ${error}`);
      return {
        availableCredits: 0,
        totalEarnedCredits: 0,
        totalUsedCredits: 0,
        lastMinimumLinksForTask: 0,
        success: false,
        message: `Error fetching credit information: ${error}`,
      };
    }
  }

  /**
   * Get all X usernames registered for a Telegram user
   * @param telegramUserId Telegram user ID
   * @returns Array of X usernames or empty array if none found
   */
  async getAllUsernamesForUser(telegramUserId: string): Promise<string[]> {
    try {
      // Get user data directly from database
      const usersCollection = getCollection<ITelegramUser>("interactXTgUsers");
      const userData = await usersCollection.findOne({
        userId: telegramUserId,
      });

      if (
        !userData ||
        !userData.registeredUsernames ||
        userData.registeredUsernames.length === 0
      ) {
        return [];
      }

      return userData.registeredUsernames;
    } catch (error) {
      logger.error(
        `Error getting usernames for user ${telegramUserId}: ${error}`
      );
      return [];
    }
  }

  /**
   * Cập nhật credits của người dùng khi hoàn thành nhiệm vụ
   * @param task Nhiệm vụ đã hoàn thành
   */
  private async updateUserCreditsOnTaskCompletion(task: ITask): Promise<void> {
    try {
      const { telegramUserId, xUsername, _id, minimumLinksForTask } = task;

      if (!_id) {
        logger.warn(`Không tìm thấy ID của task để cập nhật credits`);
        return;
      }

      const creditsCollection = getCollection<IUserCredit>(
        "interactXUserCredits"
      );

      // Tìm bản ghi credit của người dùng
      let userCredit = await creditsCollection.findOne({
        telegramUserId,
        xUsername,
      });

      const now = new Date();

      if (!userCredit) {
        // Nếu chưa có bản ghi credit, tạo mới
        const newUserCredit: IUserCredit = {
          telegramUserId,
          xUsername,
          availableCredits: 1, // Thêm 1 credit vì hoàn thành 1 task
          totalEarnedCredits: 1,
          totalUsedCredits: 0,
          lastTaskId: _id,
          lastMinimumLinksForTask: minimumLinksForTask,
          createdAt: now,
          updatedAt: now,
        };

        await creditsCollection.insertOne(newUserCredit);
        logger.success(
          `Đã tạo bản ghi credit đầu tiên cho ${xUsername} với 1 credit`
        );
      } else {
        // Nếu đã có bản ghi, tăng credit
        await creditsCollection.updateOne(
          { telegramUserId, xUsername },
          {
            $inc: {
              availableCredits: 1,
              totalEarnedCredits: 1,
            },
            $set: {
              lastTaskId: _id,
              lastMinimumLinksForTask: minimumLinksForTask,
              updatedAt: now,
            },
          }
        );

        logger.success(
          `Đã cập nhật credit cho ${xUsername}, thêm 1 credit mới`
        );
      }
    } catch (error) {
      logger.error(`Lỗi khi cập nhật credits: ${error}`);
    }
  }

  /**
   * Lấy số lượng nhiệm vụ đã hoàn thành của người dùng
   * @param telegramUserId ID người dùng Telegram
   * @param xUsername Tên người dùng X
   * @returns Số lượng nhiệm vụ đã hoàn thành
   */
  async getCompletedTaskCount(
    telegramUserId: string,
    xUsername: string
  ): Promise<{ completedCount: number; success: boolean; message?: string }> {
    try {
      const tasksCollection = getCollection<ITask>("interactXTasks");

      // Đếm số nhiệm vụ đã hoàn thành
      const completedCount = await tasksCollection.countDocuments({
        telegramUserId,
        xUsername,
        status: "done",
      });

      return {
        completedCount,
        success: true,
      };
    } catch (error) {
      logger.error(`Lỗi khi lấy số nhiệm vụ đã hoàn thành: ${error}`);
      return {
        completedCount: 0,
        success: false,
        message: `Lỗi: ${error}`,
      };
    }
  }
}

export default TaskManager;
