import { RequestHandler } from "express";
import { getCollection } from "../../../utils/mongoDb";

interface IInteractPost {
  _id: string;
  authorUsername: string;
  action: string | null;
  targetUsername: string;
  postId: string;
  createdAt: Date;
  updatedAt: Date;
}

class InteractPostHandler {
  constructor() {}

  /**
   * Get interact posts with pagination and filtering
   * Supports search by postId, full URL, authorUsername, and targetUsername
   */
  public getInteractPosts: RequestHandler = async (req, res) => {
    const {
      search,
      authorUsername,
      targetUsername,
      page = "1",
      limit = "10",
    } = req.query;

    try {
      // Build filter
      const filter: Record<string, any> = {};

      // Handle search parameter which could be postId or a URL
      if (typeof search === "string" && search.trim()) {
        let postId = search.trim();

        // Check if search is a URL
        if (search.includes("x.com/") || search.includes("twitter.com/")) {
          // Extract postId from URL (last path segment before query params)
          const urlMatch = search.match(/\/status\/(\d+)/i);
          if (urlMatch && urlMatch[1]) {
            postId = urlMatch[1];
          }
        }

        // Search by postId with flexible matching
        if (postId) {
          // Use regex to find partial matches too
          filter.postId = { $regex: postId, $options: "i" };
        }
      }

      // Filter by authorUsername
      if (typeof authorUsername === "string" && authorUsername.trim()) {
        filter.authorUsername = { $regex: authorUsername, $options: "i" };
      }

      // Filter by targetUsername
      if (typeof targetUsername === "string" && targetUsername.trim()) {
        filter.targetUsername = { $regex: targetUsername, $options: "i" };
      }

      // Parse page & limit
      const pageNum = Math.max(parseInt(page as string, 10) || 1, 1);
      const limitNum = Math.max(parseInt(limit as string, 10) || 10, 1);
      const skipNum = (pageNum - 1) * limitNum;

      const interactPostCollection =
        getCollection<IInteractPost>("interactPosts");

      // Get posts with pagination
      const [posts, total] = await Promise.all([
        interactPostCollection
          .find(filter)
          .sort({ createdAt: -1 }) // Sort by newest first
          .skip(skipNum)
          .limit(limitNum)
          .toArray(),
        interactPostCollection.countDocuments(filter),
      ]);

      // Calculate total pages
      const totalPages = Math.ceil(total / limitNum);

      res.status(200).json({
        ok: true,
        message: "Interact posts fetched successfully",
        data: posts,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
        },
      });
    } catch (err: any) {
      console.error("Error fetching interact posts:", err);
      res.status(500).json({
        ok: false,
        message: "Failed to fetch interact posts",
        error: err.message,
      });
    }
  };
}

export default InteractPostHandler;
