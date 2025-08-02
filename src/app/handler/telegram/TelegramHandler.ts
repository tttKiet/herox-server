interface GetTgUsersQuery {
  userId?: string;
  username?: string;
  chatId?: string;
  page?: string;
  limit?: string;
}
import { RequestHandler } from "express";
import {
  IGetTgPostsQuery,
  IGetTaskLinksQuery,
  ITelegramUser,
  ITaskLink,
  IXPost,
} from "src/utils/interfaces";
import { logger } from "../../../utils/logger";
import { getCollection } from "../../../utils/mongoDb";

interface IInteractXTask {
  _id?: string;
  telegramUserId: string;
  xUsername: string;
  taskNumber: number;
  minimumLinksForTask: number;
  totalLinks: number;
  completedLinks: number;
  status: "pending" | "in_progress" | "done" | "failed";
  createdAt?: Date;
  updatedAt?: Date;
}

interface GetTasksQuery {
  telegramUserId?: string;
  xUsername?: string;
  status?: string;
  taskNumber?: string;
  fromDate?: string;
  toDate?: string;
  taskDate?: string; // Single date filter
  page?: string;
  limit?: string;
}

interface IInteractXUserCredit {
  _id?: string;
  telegramUserId: string;
  xUsername: string;
  availableCredits: number;
  totalEarnedCredits: number;
  totalUsedCredits: number;
  lastTaskId?: string;
  lastMinimumLinksForTask?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface GetUserCreditsQuery {
  telegramUserId?: string;
  xUsername?: string;
  page?: string;
  limit?: string;
}

class TelegramHandler {
  public getTgUsers: RequestHandler<{}, any, any> = async function (
    req,
    res,
    next
  ) {
    const {
      userId,
      username,
      chatId,
      page = "1",
      limit = "10",
    }: GetTgUsersQuery = req.query as any;

    try {
      // Build filter
      const filter: {
        userId?: string;
        username?: { $regex: string; $options: string };
        chatId?: string;
        registeredUsernames?: string | { $in: string[] };
      } = {};

      if (userId && userId.trim()) {
        filter.userId = userId;
      }
      if (username && username.trim()) {
        filter.username = { $regex: username, $options: "i" };
      }
      if (chatId && chatId.trim()) {
        filter.chatId = chatId;
      }

      // Parse page & limit
      const pageNum = Math.max(parseInt(page as string, 10) || 1, 1);
      const limitNum = Math.max(parseInt(limit as string, 10) || 10, 1);
      const skipNum = (pageNum - 1) * limitNum;

      const tgUserCollection = getCollection<ITelegramUser>("interactXTgUsers");
      const [users, total] = await Promise.all([
        tgUserCollection
          .find(filter)
          .sort({ createdAt: -1 })
          .skip(skipNum)
          .limit(limitNum)
          .toArray(),
        tgUserCollection.countDocuments(filter),
      ]);

      res.status(200).json({
        ok: true,
        message: "Telegram users fetched successfully!",
        data: users,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });

      return;
    } catch (error: any) {
      logger.error("Error fetching telegram users:", error?.message);
      res.status(500).json({
        ok: false,
        message: `Failed to fetch telegram users: ${error?.message}`,
      });
      return;
    }
  };

  public getUserCredits: RequestHandler<{}, any, any> = async function (
    req,
    res,
    next
  ) {
    const {
      telegramUserId,
      xUsername,
      page = "1",
      limit = "10",
    }: GetUserCreditsQuery = req.query as any;

    try {
      // Build filter
      const filter: {
        telegramUserId?: string;
        xUsername?: { $regex: string; $options: string };
      } = {};

      if (telegramUserId && telegramUserId.trim()) {
        filter.telegramUserId = telegramUserId;
      }
      if (xUsername && xUsername.trim()) {
        filter.xUsername = { $regex: xUsername, $options: "i" };
      }

      // Parse page & limit
      const pageNum = Math.max(parseInt(page as string, 10) || 1, 1);
      const limitNum = Math.max(parseInt(limit as string, 10) || 10, 1);
      const skipNum = (pageNum - 1) * limitNum;

      const creditsCollection = getCollection<IInteractXUserCredit>(
        "interactXUserCredits"
      );
      const [userCredits, total] = await Promise.all([
        creditsCollection
          .find(filter)
          .sort({ updatedAt: -1 })
          .skip(skipNum)
          .limit(limitNum)
          .toArray(),
        creditsCollection.countDocuments(filter),
      ]);

      res.status(200).json({
        ok: true,
        message: "User credits fetched successfully!",
        data: userCredits,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });

      return;
    } catch (error: any) {
      logger.error("Error fetching user credits:", error?.message);
      res.status(500).json({
        ok: false,
        message: `Failed to fetch user credits: ${error?.message}`,
      });
      return;
    }
  };

  public getTasks: RequestHandler<{}, any, any> = async function (
    req,
    res,
    next
  ) {
    // Comment out debug logs before production
    // console.log("getTasks request query:", req.query);

    const {
      telegramUserId,
      xUsername,
      status,
      taskNumber,
      fromDate,
      toDate,
      taskDate,
      page = "1",
      limit = "10",
    }: GetTasksQuery = req.query as any;

    try {
      // Build filter
      const filter: any = {};
      if (telegramUserId && telegramUserId.trim()) {
        filter.telegramUserId = telegramUserId;
      }
      if (xUsername && xUsername.trim()) {
        filter.xUsername = { $regex: xUsername, $options: "i" };
      }
      if (status && status.trim()) {
        filter.status = status;
      }
      if (taskNumber && taskNumber.trim()) {
        filter.taskNumber = parseInt(taskNumber, 10);
      }

      // Add date filter
      if (fromDate || toDate || taskDate) {
        filter.createdAt = {};
        if (fromDate) {
          filter.createdAt.$gte = new Date(fromDate);
        }
        if (toDate) {
          filter.createdAt.$lte = new Date(toDate);
        }
        if (taskDate) {
          console.log("Raw taskDate from client:", taskDate);

          // Parse the date string (expect YYYY-MM-DD)
          const [year, month, day] = taskDate
            .split("-")
            .map((num) => parseInt(num, 10));

          // Create date objects for start and end of the day in local timezone
          // Note: Months are 0-based in JavaScript Date
          const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
          const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

          filter.createdAt = {
            $gte: startOfDay,
            $lte: endOfDay,
          };

          console.log("Filtering by taskDate:", taskDate);
          console.log("Start of day:", startOfDay.toISOString());
          console.log("End of day:", endOfDay.toISOString());
        }
      }

      // Parse page & limit
      const pageNum = Math.max(parseInt(page as string, 10) || 1, 1);
      const limitNum = Math.max(parseInt(limit as string, 10) || 10, 1);
      const skipNum = (pageNum - 1) * limitNum;

      const tasksCollection = getCollection<IInteractXTask>("interactXTasks");
      const [tasks, total] = await Promise.all([
        tasksCollection
          .find(filter)
          .sort({ taskNumber: -1 })
          .skip(skipNum)
          .limit(limitNum)
          .toArray(),
        tasksCollection.countDocuments(filter),
      ]);

      res.status(200).json({
        ok: true,
        message: "Tasks fetched successfully!",
        data: tasks,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });

      return;
    } catch (error: any) {
      logger.error("Error fetching tasks:", error?.message);
      res.status(500).json({
        ok: false,
        message: `Failed to fetch tasks: ${error?.message}`,
      });
      return;
    }
  };

  public updateTaskStatus: RequestHandler<{ taskId: string }, any, any> =
    async function (req, res, next) {
      const { taskId } = req.params;
      const { status } = req.body;

      try {
        if (
          !status ||
          !["pending", "in_progress", "done", "failed"].includes(status)
        ) {
          res.status(400).json({
            ok: false,
            message: "Valid status is required",
          });
          return;
        }

        const tasksCollection = getCollection<IInteractXTask>("interactXTasks");
        const result = await tasksCollection.updateOne(
          { _id: taskId },
          {
            $set: {
              status,
              updatedAt: new Date(),
            },
          }
        );

        if (result.matchedCount === 0) {
          res.status(404).json({
            ok: false,
            message: "Task not found",
          });
          return;
        }

        res.status(200).json({
          ok: true,
          message: "Task status updated successfully",
        });
        return;
      } catch (error: any) {
        logger.error("Error updating task status:", error?.message);
        res.status(500).json({
          ok: false,
          message: `Failed to update task status: ${error?.message}`,
        });
        return;
      }
    };

  public getTgPosts: RequestHandler<{}, any, any> = async function (
    req,
    res,
    next
  ) {
    // Comment out debug logs before production
    // console.log("getTgPosts request query:", req.query);

    const {
      postId,
      username,
      type,
      taskDate,
      page = "1",
      limit = "10",
    }: IGetTgPostsQuery = req.query as any;

    try {
      // Build filter
      const filter: any = {};

      if (postId && postId.trim()) {
        filter.postId = postId;
      }

      if (username && username.trim()) {
        filter.username = { $regex: username, $options: "i" };
      }

      if (type && type.trim()) {
        filter.type = type;
      }

      // Add date filter
      if (taskDate) {
        console.log("Raw taskDate from client:", taskDate);

        // Parse the date string (expect YYYY-MM-DD)
        const [year, month, day] = taskDate
          .split("-")
          .map((num) => parseInt(num, 10));

        // Create date objects for start and end of the day in local timezone
        // Note: Months are 0-based in JavaScript Date
        const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
        const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

        filter.createdAt = {
          $gte: startOfDay,
          $lte: endOfDay,
        };

        console.log("Filtering by taskDate:", taskDate);
        console.log("Start of day:", startOfDay.toISOString());
        console.log("End of day:", endOfDay.toISOString());
      }

      // Parse page & limit
      const pageNum = Math.max(parseInt(page as string, 10) || 1, 1);
      const limitNum = Math.max(parseInt(limit as string, 10) || 10, 1);
      const skipNum = (pageNum - 1) * limitNum;

      const postsCollection = getCollection<IXPost>("interactXTgPosts");

      const [posts, total] = await Promise.all([
        postsCollection
          .find(filter)
          .sort({ createdAt: -1 }) // Newest first
          .skip(skipNum)
          .limit(limitNum)
          .toArray(),
        postsCollection.countDocuments(filter),
      ]);

      res.json({
        ok: true,
        message: "Telegram X posts retrieved successfully",
        data: posts,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error: any) {
      // Use logger instead of console.error for production
      logger.error(`Error fetching Telegram X posts: ${error?.message}`);
      res.status(500).json({
        ok: false,
        message: `Failed to fetch Telegram X posts: ${error?.message}`,
      });
    }
  };

  public updateTaskLinkStatus: RequestHandler<{}, any, any> = async function (
    req,
    res,
    next
  ) {
    const { linkId, status } = req.body;

    if (!linkId) {
      res.status(400).json({
        ok: false,
        message: "Missing task link ID",
      });
    }

    if (!["pending", "in_progress", "done", "failed"].includes(status)) {
      res.status(400).json({
        ok: false,
        message: "Invalid status value",
      });
    }

    try {
      const taskLinksCollection =
        getCollection<ITaskLink>("interactXTaskLinks");

      const result = await taskLinksCollection.findOneAndUpdate(
        { _id: linkId },
        { $set: { status, updatedAt: new Date() } },
        { returnDocument: "after" }
      );

      if (!result) {
        res.status(404).json({
          ok: false,
          message: "Task link not found",
        });
      }

      res.json({
        ok: true,
        message: "Task link status updated successfully",
        data: result,
      });
    } catch (error: any) {
      // Use logger instead of console.error for production
      logger.error(`Error updating task link status: ${error?.message}`);
      res.status(500).json({
        ok: false,
        message: `Failed to update task link status: ${error?.message}`,
      });
    }
  };

  public getTaskLinks: RequestHandler<{}, any, any> = async function (
    req,
    res,
    next
  ) {
    // Comment out debug logs before production
    // console.log("getTaskLinks request query:", req.query);

    const {
      taskId,
      postId,
      type,
      status,
      taskDate,
      fromDate,
      toDate,
      page = "1",
      limit = "10",
    }: IGetTaskLinksQuery = req.query as any;

    try {
      // Build filter
      const filter: any = {};

      if (taskId && taskId.trim()) {
        filter.taskId = { $regex: taskId, $options: "i" };
      }

      if (postId && postId.trim()) {
        filter.postId = { $regex: postId, $options: "i" };
      }

      if (type && type.trim()) {
        filter.type = type;
      }

      if (status && status.trim()) {
        filter.status = status;
      }

      // Add date filter - support both old taskDate and new fromDate/toDate
      if (fromDate || toDate || taskDate) {
        filter.createdAt = {};

        if (taskDate) {
          console.log("Raw taskDate from client:", taskDate);

          // Parse the date string (expect YYYY-MM-DD)
          const [year, month, day] = taskDate
            .split("-")
            .map((num) => parseInt(num, 10));

          // Create date objects for start and end of the day in local timezone
          // Note: Months are 0-based in JavaScript Date
          const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
          const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

          filter.createdAt = {
            $gte: startOfDay,
            $lte: endOfDay,
          };

          console.log("Filtering by taskDate:", taskDate);
          console.log("Start of day:", startOfDay.toISOString());
          console.log("End of day:", endOfDay.toISOString());
        } else {
          // Handle new fromDate/toDate parameters
          if (fromDate) {
            filter.createdAt.$gte = new Date(fromDate);
            console.log("Filtering by fromDate:", fromDate);
            console.log("Converted to date:", new Date(fromDate).toISOString());
          }

          if (toDate) {
            filter.createdAt.$lte = new Date(toDate);
            console.log("Filtering by toDate:", toDate);
            console.log("Converted to date:", new Date(toDate).toISOString());
          }
        }
      }

      // Parse page & limit
      const pageNum = Math.max(parseInt(page as string, 10) || 1, 1);
      const limitNum = Math.max(parseInt(limit as string, 10) || 10, 1);
      const skipNum = (pageNum - 1) * limitNum;

      const taskLinksCollection =
        getCollection<ITaskLink>("interactXTaskLinks");

      const [taskLinks, total] = await Promise.all([
        taskLinksCollection
          .find(filter)
          .sort({ createdAt: -1 }) // Newest first
          .skip(skipNum)
          .limit(limitNum)
          .toArray(),
        taskLinksCollection.countDocuments(filter),
      ]);

      res.json({
        ok: true,
        message: "Task links retrieved successfully",
        data: taskLinks,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error: any) {
      // Use logger instead of console.error for production
      logger.error(`Error fetching task links: ${error?.message}`);
      res.status(500).json({
        ok: false,
        message: `Failed to fetch task links: ${error?.message}`,
      });
    }
  };
}

export default TelegramHandler;
