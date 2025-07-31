interface GetUserCreditsQuery {
  telegramUserId?: string;
  xUsername?: string;
  page?: string;
  limit?: string;
}

import { RequestHandler } from "express";
import { getCollection } from "../../../utils/mongoDb";
import { logger } from "../../../utils/logger";

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

class InteractXUserCreditsHandler {
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
}

export default InteractXUserCreditsHandler;
