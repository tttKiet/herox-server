import { RequestHandler } from "express";
import { getCollection } from "../../../utils/mongoDb";
import { IAdmin, IChat } from "../../../utils/interfaces";
import { ObjectId } from "mongodb";

class ChatHandler {
  constructor() {}

  /**
   * Get chats with pagination and filtering
   */
  public getChats = async (req: any, res: any) => {
    const {
      memberId,
      userMessage,
      status,
      startDate,
      endDate,
      page = "1",
      limit = "10",
    } = req.query;

    try {
      // Build filter
      const filter: Record<string, any> = {};

      if (typeof memberId === "string" && memberId.trim()) {
        if (!ObjectId.isValid(memberId)) {
          return res.status(400).json({
            ok: false,
            message: "Invalid memberId format",
          });
        }

        // Since the type in database could vary, we need to handle both string and ObjectId
        // Create a flexible query that will match regardless of the type stored
        const objId = new ObjectId(memberId);
        filter.memberId = memberId;
      }

      if (typeof userMessage === "string" && userMessage.trim()) {
        // Search in both userMessage and aiContent fields
        filter.$or = [
          { userMessage: { $regex: userMessage, $options: "i" } },
          { aiContent: { $regex: userMessage, $options: "i" } },
        ];
      }

      if (
        typeof status === "string" &&
        ["pending", "error", "success"].includes(status)
      ) {
        // Use exact string matching for status
        filter.status = status;
      }

      // Date range filter
      if (startDate || endDate) {
        filter.createdAt = {};

        if (typeof startDate === "string" && startDate.trim()) {
          try {
            filter.createdAt.$gte = new Date(startDate);
          } catch (err) {}
        }

        if (typeof endDate === "string" && endDate.trim()) {
          try {
            filter.createdAt.$lte = new Date(endDate);
          } catch (err) {
            console.error("Invalid endDate format:", endDate);
          }
        }

        // If no valid dates were added, remove the empty filter
        if (Object.keys(filter.createdAt).length === 0) {
          delete filter.createdAt;
        }
      }

      // Parse page & limit
      const pageNum = Math.max(parseInt(page as string, 10) || 1, 1);
      const limitNum = Math.max(parseInt(limit as string, 10) || 10, 1);
      const skipNum = (pageNum - 1) * limitNum;

      const chatCollection = getCollection<IChat>("chats");
      const adminCollection = getCollection<IAdmin>("admins");

      // Convert filter.status to exact match if needed
      if (filter.status) {
        // Make sure we're doing an exact match for status, not a regex match
        filter.status = { $eq: filter.status };
      }

      // Get chats with pagination
      const [chats, total] = await Promise.all([
        chatCollection
          .find(filter)
          .sort({ createdAt: -1 })
          .skip(skipNum)
          .limit(limitNum)
          .toArray(),
        chatCollection.countDocuments(filter),
      ]);

      const memberIds = [
        ...new Set(
          chats.map((chat) =>
            chat.memberId instanceof ObjectId
              ? chat.memberId
              : new ObjectId(chat.memberId)
          )
        ),
      ];

      // Get admin info for each chat
      const admins =
        memberIds.length > 0
          ? await adminCollection.find({ _id: { $in: memberIds } }).toArray()
          : [];
      //   console.log("Member IDs:", memberIds);
      //   console.log("Admins fetched:", admins);
      // Map adminInfo to chats
      const chatsWithAdmin = chats.map((chat) => {
        const adminInfo = admins.find(
          (admin) => admin._id?.toString() === chat.memberId.toString()
        );

        return {
          ...chat,
          admin: adminInfo || null,
        };
      });

      res.status(200).json({
        ok: true,
        message: "Chats fetched successfully!",
        data: chatsWithAdmin,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
      return;
    } catch (err: any) {
      console.error("Error fetching chats:", err);
      res.status(500).json({
        ok: false,
        message: "Failed to fetch chats",
        error: err.message,
      });
      return;
    }
  };
}

export default ChatHandler;
