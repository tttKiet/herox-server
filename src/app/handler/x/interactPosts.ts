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

  /**
   * Get random non-interacted links for a specific author
   * Filters out links that have already been interacted with by the provided author
   */
  public getRandomNonInteractedLink: RequestHandler = async (req, res) => {
    const { apiKey, authorUsername, myUserName } = req.body;
    let links = req.body.links || [];

    // Process links if it's a string with format "link1||link2||link3"
    if (typeof links === "string") {
      links = links.split("||").filter((link) => link.trim() !== "");
    }

    // Validate required parameters
    if (!authorUsername || !Array.isArray(links) || links.length === 0) {
      res.status(400).json({
        ok: false,
        message:
          "Missing required parameters: authorUsername and links array or string",
      });
      return;
    }

    try {
      const interactPostCollection =
        getCollection<IInteractPost>("interactPosts");

      // Extract postIds from links
      const postIds = links.map((link) => {
        // Check if it's a URL and extract postId
        if (
          typeof link === "string" &&
          (link.includes("x.com/") || link.includes("twitter.com/"))
        ) {
          const urlMatch = link.match(/\/status\/(\d+)/i);
          return urlMatch && urlMatch[1] ? urlMatch[1] : link;
        }
        return link;
      });

      // Find all posts that have been interacted with by this author
      const interactedPosts = await interactPostCollection
        .find({
          authorUsername: authorUsername,
          postId: { $in: postIds },
        })
        .toArray();

      // Extract the postIds that have been interacted with
      const interactedPostIds = interactedPosts.map((post) => post.postId);

      // Filter out the links that have not been interacted with and not from myUserName
      const nonInteractedLinks = links.filter((link) => {
        // Skip empty links
        if (!link || link.trim() === "") return false;

        // Skip links from myUserName if provided
        if (myUserName && typeof link === "string") {
          // Check if the link contains myUserName
          const userRegex = new RegExp(
            `x\\.com\\/${myUserName}[\\/\\?]|twitter\\.com\\/${myUserName}[\\/\\?]`,
            "i"
          );
          if (userRegex.test(link)) return false;
        }

        // Check if it's already been interacted with
        const postId = this.extractPostIdFromLink(link);
        return !interactedPostIds.includes(postId);
      });

      // Select a random link from the non-interacted links
      let randomLink = null;
      if (nonInteractedLinks.length > 0) {
        const randomIndex = Math.floor(
          Math.random() * nonInteractedLinks.length
        );
        randomLink = nonInteractedLinks[randomIndex];
      }

      res.status(200).json({
        ok: true,
        message: "Non-interacted links retrieved successfully",
        data: {
          nonInteractedLinks: nonInteractedLinks,
          randomLink: randomLink,
        },
      });
    } catch (err: any) {
      console.error("Error getting non-interacted links:", err);
      res.status(500).json({
        ok: false,
        message: "Failed to get non-interacted links",
        error: err.message,
      });
    }
  };

  /**
   * Helper method to extract postId from a link
   */
  private extractPostIdFromLink(link: string): string {
    if (!link) return "";

    if (
      typeof link === "string" &&
      (link.includes("x.com/") || link.includes("twitter.com/"))
    ) {
      const urlMatch = link.match(/\/status\/(\d+)/i);
      return urlMatch && urlMatch[1] ? urlMatch[1] : link;
    }
    return link;
  }
}

export default InteractPostHandler;
