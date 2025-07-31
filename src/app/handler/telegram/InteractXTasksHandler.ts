// interactXTasksHandler.ts
import { MongoClient, ObjectId } from "mongodb";
import { getCollection } from "../../../utils/mongoDb";
import { RequestHandler } from "express";

// Interface for Task
interface IInteractXTask {
  _id?: string | ObjectId;
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

interface PaginatedResponse<T> {
  ok: boolean;
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class InteractXTasksHandler {
  /**
   * Get all tasks with pagination and filtering
   */
  getTasks: RequestHandler<{}, any, any> = async (req, res) => {
    try {
      // Parse query parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const telegramUserId = req.query.telegramUserId as string;
      const xUsername = req.query.xUsername as string;
      const status = req.query.status as string;
      const taskNumber = req.query.taskNumber
        ? parseInt(req.query.taskNumber as string)
        : undefined;
      const fromDate = req.query.fromDate as string;
      const toDate = req.query.toDate as string;

      // Build filter object
      const filter: any = {};
      if (telegramUserId) filter.telegramUserId = telegramUserId;
      if (xUsername) filter.xUsername = { $regex: xUsername, $options: "i" };
      if (status) filter.status = status;
      if (taskNumber) filter.taskNumber = taskNumber;

      // Add date range filter if provided
      if (fromDate || toDate) {
        filter.createdAt = {};
        if (fromDate) filter.createdAt.$gte = new Date(fromDate);
        if (toDate) filter.createdAt.$lte = new Date(toDate);
      }

      // Get the tasks collection
      const tasksCollection = getCollection<IInteractXTask>("interactXTasks");

      // Count total documents for pagination
      const total = await tasksCollection.countDocuments(filter);
      const totalPages = Math.ceil(total / limit);

      // Get paginated results
      const tasks = await tasksCollection
        .find(filter)
        .sort({ createdAt: -1 }) // Sort by creation date desc
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray();

      // Convert MongoDB ObjectId to string
      const formattedTasks = tasks.map((task) => ({
        ...task,
        _id: task._id!.toString(),
      }));

      res.status(200).json({
        ok: true,
        message: "Tasks retrieved successfully",
        data: formattedTasks,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      });
    } catch (error) {
      console.error("Error getting tasks:", error);
      res.status(500).json({
        ok: false,
        message: "Failed to retrieve tasks",
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      });
    }
  };

  /**
   * Update a task's status
   */
  updateTaskStatus: RequestHandler<{}, any, any> = async (req, res) => {
    try {
      const taskId = req.query.taskId as string;
      const { status } = req.body;

      if (!taskId) {
        res.status(400).json({
          ok: false,
          message: "Task ID is required",
        });
      }

      if (
        !status ||
        !["pending", "in_progress", "done", "failed"].includes(status)
      ) {
        res.status(400).json({
          ok: false,
          message: "Valid status is required",
        });
      }

      const tasksCollection = getCollection<IInteractXTask>("interactXTasks");

      const result = await tasksCollection.updateOne(
        { _id: new ObjectId(taskId) },
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
      }

      res.status(200).json({
        ok: true,
        message: "Task status updated successfully",
      });
    } catch (error) {
      console.error("Error updating task status:", error);
      res.status(500).json({
        ok: false,
        message: "Failed to update task status",
      });
    }
  };
}
