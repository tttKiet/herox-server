import "dotenv/config";
import { ObjectId } from "mongodb";
import { logger } from "../utils/logger";
import { getCollection } from "../utils/mongoDb";
import { ITelegramUser, IXPost, IInteraction } from "../utils/interfaces";
import postService from "../services/postService";
import interactXSettingsService from "../services/interactXSettingsService";
import axios from "axios";
import { configDotenv } from "dotenv";
import { isXPostLinks } from "../app/handler/telegram/scenes/postLinks/linkUtils";
import { redis } from "../utils";
configDotenv();

interface RegisterUserParams {
  userId: string;
  username: string;
  chatId: string;
  xUsernames: string[];
}

interface SavePostParams {
  postId: string;
  postUrl: string;
  username: string;
  content?: string;
  type?: "member" | "admin";
}

interface CreateInteractionParams {
  telegramUserId: string;
  xUsername: string;
  targetPostId: string;
  targetPostUrl: string;
  interactionType: "comment" | "like" | "retweet";
}

interface VerifyInteractionParams {
  telegramUserId: string;
  xUsername: string;
  requiredInteractions?: number; // Minimum number of interactions required
}

interface PostLinkParams {
  telegramUserId: string;
  xUsername: string;
  postUrls: string[];
}

class InteractXTgBot {
  constructor() {
    // No initialization in constructor
  }

  /**
   * Register or update a Telegram user with their X usernames
   */
  async registerUser({
    userId,
    username,
    chatId,
    xUsernames,
  }: RegisterUserParams): Promise<ITelegramUser> {
    try {
      const usersCollection = getCollection<ITelegramUser>("interactXTgUsers");

      // Check if user already exists
      const existingUser = await usersCollection.findOne({ userId });
      if (existingUser) {
        logger.info(`Found existing user ${username} (${userId}) in database`);
      }

      if (existingUser) {
        // Update existing user
        const updatedUsernames = [
          ...new Set([...existingUser.registeredUsernames, ...xUsernames]),
        ];

        await usersCollection.updateOne(
          { userId },
          {
            $set: {
              username,
              chatId,
              registeredUsernames: updatedUsernames,
              updatedAt: new Date(),
            },
          }
        );

        logger.success(
          `User ${username} updated with ${xUsernames.join(", ")} usernames`
        );
        return {
          ...existingUser,
          username,
          chatId,
          registeredUsernames: updatedUsernames,
          updatedAt: new Date(),
        };
      } else {
        // Create new user
        const newUser: ITelegramUser = {
          userId,
          username,
          chatId,
          registeredUsernames: xUsernames,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await usersCollection.insertOne(newUser);
        logger.success(
          `New user ${username} registered with ${xUsernames.join(
            ", "
          )} usernames`
        );
        return newUser;
      }
    } catch (error: any) {
      logger.error(`Error registering user: ${error.message}`);
      throw new Error(`Failed to register user: ${error.message}`);
    }
  }

  /**
   * Get all X usernames registered by a Telegram user
   */
  async getUserXUsernames(telegramUserId: string): Promise<string[]> {
    try {
      const usersCollection = getCollection<ITelegramUser>("interactXTgUsers");
      const user = await usersCollection.findOne({
        userId: telegramUserId,
      });
      if (!user) {
        return [];
      }
      return user.registeredUsernames || [];
    } catch (error: any) {
      logger.error(`Error getting user X usernames: ${error.message}`);
      return [];
    }
  }

  /**
   * Get all posts for a specific username
   */
  async getUserPosts(username: string): Promise<IXPost[]> {
    try {
      const postsCollection = getCollection<IXPost>("interactXTgPosts");
      const posts = await postsCollection.find({ username }).toArray();
      return posts;
    } catch (error: any) {
      logger.error(`Error getting posts for ${username}: ${error.message}`);
      return [];
    }
  }

  /**
   * Create an interaction record for a user
   */
  async createInteraction({
    telegramUserId,
    xUsername,
    targetPostId,
    targetPostUrl,
    interactionType,
  }: CreateInteractionParams): Promise<IInteraction> {
    try {
      const interactionsCollection = getCollection<IInteraction>(
        "interactXTgInteractions"
      );

      // Check if interaction already exists
      const existingInteraction = await interactionsCollection.findOne({
        telegramUserId,
        xUsername,
        targetPostId,
        interactionType,
      });

      if (existingInteraction) {
        return existingInteraction;
      }

      // Create new interaction
      const newInteraction: IInteraction = {
        telegramUserId,
        xUsername,
        targetPostId,
        targetPostUrl,
        status: "todo", // Default status
        interactionType,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await interactionsCollection.insertOne(newInteraction);
      logger.success(
        `New ${interactionType} interaction created for ${xUsername} on post ${targetPostId}`
      );
      return newInteraction;
    } catch (error: any) {
      logger.error(`Error creating interaction: ${error.message}`);
      throw new Error(`Failed to create interaction: ${error.message}`);
    }
  }

  /**
   * Get all interactions for a specific X username
   */
  async getUserInteractions(
    telegramUserId: string,
    xUsername: string
  ): Promise<IInteraction[]> {
    try {
      const interactionsCollection = getCollection<IInteraction>(
        "interactXTgInteractions"
      );
      const interactions = await interactionsCollection
        .find({
          telegramUserId,
          xUsername,
        })
        .toArray();
      return interactions;
    } catch (error: any) {
      logger.error(
        `Error getting interactions for ${xUsername}: ${error.message}`
      );
      return [];
    }
  }

  /**
   * Verify if a user has completed the required interactions
   * This is a mock function that always returns true for demonstration purposes
   * In a real application, this would check with the X API if the user has actually commented
   */
  async verifyInteractions({
    telegramUserId,
    xUsername,
    requiredInteractions = 3,
  }: VerifyInteractionParams): Promise<{
    success: boolean;
    completed: number;
    required: number;
    message: string;
  }> {
    try {
      const interactionsCollection = getCollection<IInteraction>(
        "interactXTgInteractions"
      );

      // Get all interactions for this user
      const interactions = await interactionsCollection
        .find({
          telegramUserId,
          xUsername,
          status: "todo",
        })
        .toArray();

      // Mock verification - in reality, this would check against the X API
      for (const interaction of interactions) {
        // For demonstration, we will just mark it as done
        await interactionsCollection.updateOne(
          { _id: interaction._id },
          {
            $set: {
              status: "done",
              commentId: `mock_comment_${Date.now()}`, // Mock comment ID
              updatedAt: new Date(),
            },
          }
        );
      }

      // Count completed interactions
      const completedInteractions = await interactionsCollection.countDocuments(
        {
          telegramUserId,
          xUsername,
          status: "done",
        }
      );

      const isCompleted = completedInteractions >= requiredInteractions;

      return {
        success: true,
        completed: completedInteractions,
        required: requiredInteractions,
        message: isCompleted
          ? `User ${xUsername} has completed ${completedInteractions} interactions (required: ${requiredInteractions})`
          : `User ${xUsername} has only completed ${completedInteractions} interactions (required: ${requiredInteractions})`,
      };
    } catch (error: any) {
      logger.error(`Error verifying interactions: ${error.message}`);
      return {
        success: false,
        completed: 0,
        required: requiredInteractions,
        message: `Failed to verify interactions: ${error.message}`,
      };
    }
  }

  /**
   * Process post links for a user, checking if they meet requirements first
   */
  async postLinks({
    telegramUserId,
    xUsername,
    postUrls,
  }: PostLinkParams): Promise<{
    success: boolean;
    username: string;
    eligibleToPosts: boolean;
    message: string;
    posts: IXPost[];
  }> {
    try {
      // First verify if user has completed enough interactions

      const verification = await this.verifyInteractions({
        telegramUserId,
        xUsername,
      });

      if (!verification.success) {
        return {
          success: false,
          username: xUsername,
          eligibleToPosts: false,
          message: verification.message,
          posts: [],
        };
      }

      // If user has not completed enough interactions, they cannot post
      if (verification.completed < verification.required) {
        return {
          success: false,
          username: xUsername,
          eligibleToPosts: false,
          message: `User ${xUsername} is not eligible to post. Need ${
            verification.required - verification.completed
          } more interactions.`,
          posts: [],
        };
      }

      // User is eligible, process the posts
      const processedPosts: IXPost[] = [];
      for (const postUrl of postUrls) {
        // Generate a mock post ID - in reality this would come from the X API
        const postId = `post_${Date.now()}_${Math.random()
          .toString(36)
          .substring(7)}`;

        const post = await postService.createOrUpdatePost({
          postId,
          postUrl,
          username: xUsername,
        });

        processedPosts.push(post);
      }

      return {
        success: true,
        username: xUsername,
        eligibleToPosts: true,
        message: `${processedPosts.length} posts processed successfully for ${xUsername}`,
        posts: processedPosts,
      };
    } catch (error: any) {
      logger.error(`Error posting links: ${error.message}`);
      return {
        success: false,
        username: xUsername,
        eligibleToPosts: false,
        message: `Failed to post links: ${error.message}`,
        posts: [],
      };
    }
  }

  /**
   * List all users in the system
   */
  async listAllUsers(): Promise<ITelegramUser[]> {
    try {
      const usersCollection = getCollection<ITelegramUser>("interactXTgUsers");
      return await usersCollection.find({}).toArray();
    } catch (error: any) {
      logger.error(`Error listing users: ${error.message}`);
      return [];
    }
  }

  /**
   * List all posts in the system
   */
  async listAllPosts(): Promise<IXPost[]> {
    try {
      const postsCollection = getCollection<IXPost>("interactXTgPosts");
      return await postsCollection.find({}).toArray();
    } catch (error: any) {
      logger.error(`Error listing posts: ${error.message}`);
      return [];
    }
  }

  /**
   * Get statistics for interactions
   */
  async getInteractionStats(): Promise<{
    totalUsers: number;
    totalPosts: number;
    totalInteractions: number;
    completedInteractions: number;
    pendingInteractions: number;
  }> {
    try {
      const usersCollection = getCollection<ITelegramUser>("interactXTgUsers");
      const postsCollection = getCollection<IXPost>("interactXTgPosts");
      const interactionsCollection = getCollection<IInteraction>(
        "interactXTgInteractions"
      );

      const totalUsers = await usersCollection.countDocuments();
      const totalPosts = await postsCollection.countDocuments();
      const totalInteractions = await interactionsCollection.countDocuments();
      const completedInteractions = await interactionsCollection.countDocuments(
        { status: "done" }
      );
      const pendingInteractions = await interactionsCollection.countDocuments({
        status: "todo",
      });

      return {
        totalUsers,
        totalPosts,
        totalInteractions,
        completedInteractions,
        pendingInteractions,
      };
    } catch (error: any) {
      logger.error(`Error getting interaction stats: ${error.message}`);
      return {
        totalUsers: 0,
        totalPosts: 0,
        totalInteractions: 0,
        completedInteractions: 0,
        pendingInteractions: 0,
      };
    }
  }

  /**
   * Update a user's X usernames list (replacing the existing list)
   * @param userId Telegram user ID
   * @param newUsernames New list of X usernames
   */
  async updateUsernames(
    userId: string,
    newUsernames: string[]
  ): Promise<ITelegramUser | null> {
    try {
      const usersCollection = getCollection<ITelegramUser>("interactXTgUsers");

      // Check if user exists
      const existingUser = await usersCollection.findOne({ userId });
      if (!existingUser) {
        logger.error(
          `User ${userId} not found when trying to update usernames`
        );
        return null;
      }

      // Update the usernames list
      await usersCollection.updateOne(
        { userId },
        {
          $set: {
            registeredUsernames: newUsernames,
            updatedAt: new Date(),
          },
        }
      );

      logger.success(
        `User ${userId} usernames updated to [${newUsernames.join(", ")}]`
      );

      // Return updated user
      return {
        ...existingUser,
        registeredUsernames: newUsernames,
        updatedAt: new Date(),
      };
    } catch (error) {
      logger.error(`Error updating usernames: ${error}`);
      return null;
    }
  }

  /**
   * Add posts from admin with type=admin
   * @param postUrls Array of post URLs to add as admin posts
   * @returns Success status and count or error message
   */
  async addAdminPosts(
    postUrls: string[]
  ): Promise<{ success: boolean; count?: number; error?: string }> {
    try {
      if (!postUrls || postUrls.length === 0) {
        return { success: false, error: "No URLs provided" };
      }
      const settings = await interactXSettingsService.getSettings();

      const addedPosts: IXPost[] = [];

      for (const url of postUrls) {
        try {
          // Extract post ID from URL
          const postId = this.extractPostIdFromUrl(url);
          if (!postId) {
            logger.warn(`Invalid X post URL: ${url}`);
            continue;
          }

          // Save post with admin type
          const post = await postService.createOrUpdatePost({
            postId,
            postUrl: url,
            username: "admin", // Use generic admin username
            type: "admin", // Mark as admin post
          });

          addedPosts.push(post);
        } catch (error) {
          logger.error(`Error adding admin post ${url}: ${error}`);
        }
      }

      logger.success(`Added ${addedPosts.length} admin posts`);
      return { success: true, count: addedPosts.length };
    } catch (error) {
      logger.error(`Error adding admin posts: ${error}`);
      return { success: false, error: `Failed to add admin posts: ${error}` };
    }
  }

  /**
   * Extract post ID from X/Twitter URL
   */
  private extractPostIdFromUrl(url: string): string | null {
    try {
      // Match Twitter/X post URLs
      const regex =
        /https?:\/\/(www\.)?(twitter\.com|x\.com)\/\w+\/status\/(\d+)/i;
      const match = url.match(regex);

      if (match && match[3]) {
        return match[3];
      }
      return null;
    } catch (error) {
      logger.error(`Error extracting post ID: ${error}`);
      return null;
    }
  }

  /**
   * Lấy thông tin chi tiết về post và replies của nó sử dụng X API
   * @param postId ID của post cần lấy thông tin
   * @param maxResults Số lượng replies tối đa cần lấy (mặc định 100)
   * @returns Thông tin về post và replies của nó
   */
  async getInfoPostXApi(
    postId: string,
    maxResults: number = 100
  ): Promise<{
    success: boolean;
    data?: any;
    error?: string;
    replies?: any[];
    userMap?: Record<string, any>;
  }> {
    try {
      // Lấy Bearer token từ biến môi trường
      const bearerToken =
        process.env.X_BEARER_TOKEN ||
        "AAAAAAAAAAAAAAAAAAAAAFt03QEAAAAAHU3BiVYRyumDm2g0Eo%2FFBaQNy1E%3DKMKYJzgNwyCOUgayHBSKoARazw97UiwfndOn8tcq8ErW25sFTj";

      if (!bearerToken) {
        throw new Error("X Bearer token is not set in environment variables");
      }

      // Giới hạn số lượng replies
      if (maxResults < 10 || maxResults > 100) {
        maxResults = 100;
      }

      // Headers cho request
      const headers = {
        Authorization: `Bearer ${bearerToken}`,
      };

      // 1. Lấy thông tin chi tiết của post gốc
      const postUrl = `https://api.x.com/2/tweets/${postId}?tweet.fields=created_at,author_id,conversation_id,public_metrics,entities&expansions=author_id,attachments.media_keys,referenced_tweets.id&user.fields=name,username,profile_image_url,verified&media.fields=url,preview_image_url`;

      const postResponse = await axios.get(postUrl, { headers });
      const postData = postResponse.data;

      // Định nghĩa các kiểu dữ liệu cơ bản
      interface XUser {
        id: string;
        name: string;
        username: string;
        profile_image_url?: string;
        verified?: boolean;
      }

      interface XTweet {
        id: string;
        text: string;
        author_id?: string;
        created_at?: string;
        conversation_id?: string;
        public_metrics?: {
          retweet_count?: number;
          reply_count?: number;
          like_count?: number;
          quote_count?: number;
        };
        referenced_tweets?: Array<{
          type: string;
          id: string;
        }>;
        in_reply_to_user_id?: string;
      }

      interface EnrichedTweet {
        id: string;
        text: string;
        created_at: string;
        author_id: string;
        conversation_id: string;
        public_metrics: any;
        author_username: string;
        author_name: string;
        author_profile_image: string | null;
        author_verified: boolean;
        in_reply_to_user_id?: string;
        referenced_tweets?: Array<{
          type: string;
          id: string;
        }>;
      }

      let originalTweet: XTweet | null = null;
      const userMap: Record<string, XUser> = {};

      // Xây dựng user map từ kết quả
      if (postData.includes && postData.includes.users) {
        postData.includes.users.forEach((user: XUser) => {
          userMap[user.id] = user;
        });
      }

      if (postData.data) {
        originalTweet = postData.data as XTweet;
      }

      // Tạo object dữ liệu post gốc
      let enrichedOriginalTweet: EnrichedTweet | null = null;
      if (originalTweet) {
        const author = originalTweet.author_id
          ? userMap[originalTweet.author_id] || {
              id: "",
              name: "Unknown User",
              username: "unknown",
            }
          : { id: "", name: "Unknown User", username: "unknown" };

        enrichedOriginalTweet = {
          id: originalTweet.id || postId,
          text: originalTweet.text || "",
          created_at: originalTweet.created_at || new Date().toISOString(),
          author_id: originalTweet.author_id || "",
          conversation_id: originalTweet.conversation_id || postId,
          public_metrics: originalTweet.public_metrics || {},
          author_username: author.username || "unknown",
          author_name: author.name || "Unknown User",
          author_profile_image: author.profile_image_url || null,
          author_verified: !!author.verified,
        };
      }

      // 2. Lấy danh sách replies sử dụng conversation_id
      // Theo tài liệu X API mới, sử dụng endpoint search recent tweets với query conversation_id
      const conversationId = originalTweet?.conversation_id || postId;
      const repliesUrl = `https://api.x.com/2/tweets/search/recent?query=conversation_id:${conversationId}&tweet.fields=created_at,author_id,in_reply_to_user_id,referenced_tweets&expansions=author_id,referenced_tweets.id&user.fields=name,username,profile_image_url,verified&max_results=${maxResults}`;

      const repliesResponse = await axios.get(repliesUrl, { headers });
      const repliesData = repliesResponse.data;

      // Cập nhật userMap từ replies
      if (repliesData.includes && repliesData.includes.users) {
        repliesData.includes.users.forEach((user: XUser) => {
          userMap[user.id] = user;
        });
      }

      // Lọc chỉ lấy replies cho post hiện tại
      const replies: XTweet[] = [];
      if (repliesData.data) {
        repliesData.data.forEach((tweet: XTweet) => {
          // Kiểm tra xem đây có phải là reply cho post gốc không
          const isReplyToOriginal =
            tweet.referenced_tweets &&
            tweet.referenced_tweets.some(
              (ref) =>
                ref.type === "replied_to" &&
                (ref.id === postId || ref.id === conversationId)
            );

          if (isReplyToOriginal && tweet.id !== postId) {
            replies.push(tweet);
          }
        });
      }

      // Làm giàu thông tin replies với dữ liệu user
      const enrichedReplies: EnrichedTweet[] = replies.map((reply) => {
        const author = reply.author_id
          ? userMap[reply.author_id] || {
              id: "",
              name: "Unknown User",
              username: "unknown",
            }
          : { id: "", name: "Unknown User", username: "unknown" };

        return {
          id: reply.id,
          text: reply.text,
          created_at: reply.created_at || new Date().toISOString(),
          author_id: reply.author_id || "",
          conversation_id: reply.conversation_id || conversationId,
          public_metrics: reply.public_metrics || {},
          author_username: author.username || "unknown",
          author_name: author.name || "Unknown User",
          author_profile_image: author.profile_image_url || null,
          author_verified: !!author.verified,
          in_reply_to_user_id: reply.in_reply_to_user_id,
          referenced_tweets: reply.referenced_tweets || [],
        };
      });

      return {
        success: true,
        data: enrichedOriginalTweet,
        replies: enrichedReplies,
        userMap: userMap,
      };
    } catch (error: any) {
      logger.error(`Error fetching post info from X API: ${error.message}`);

      // Xử lý các lỗi cụ thể
      if (error.response) {
        // Nếu có response từ API
        const status = error.response.status;
        const responseData = error.response.data;

        // Log chi tiết hơn về lỗi
        logger.error(`X API error ${status}: ${JSON.stringify(responseData)}`);

        // Xử lý các mã lỗi phổ biến
        if (status === 401) {
          return {
            success: false,
            error: "Invalid authentication credentials",
          };
        } else if (status === 403) {
          return {
            success: false,
            error:
              "Forbidden - You don't have permission to access this resource",
          };
        } else if (status === 404) {
          return { success: false, error: "Post not found" };
        } else if (status === 429) {
          return {
            success: false,
            error: "Rate limit exceeded. Please try again later.",
          };
        }

        return { success: false, error: `X API error: ${status}` };
      }

      // Lỗi khác
      return {
        success: false,
        error: `Failed to fetch post info: ${error.message}`,
      };
    }
  }

  // getInfoPostX
  async getInfoPostX(postId: string) {
    const xRapidapiKey = process.env.X_RAPIDAPI_KEY;
    const domain = "https://twitter293.p.rapidapi.com/tweet/simple";
    if (!xRapidapiKey) {
      throw new Error("X RapidAPI key is not set in environment variables");
    }

    const headers = {
      "x-rapidapi-key": xRapidapiKey,
      "x-rapidapi-host": "twitter293.p.rapidapi.com",
    };

    // call api
    try {
      const response = await axios(`${domain}/${postId}`, {
        method: "GET",
        headers,
      });

      return response.data;
    } catch (error) {
      logger.error(`Error getting post info: ${error}`);
      return null;
    }
  }

  async checkCommentPostX(usernames: string, post: string) {
    // post can: id | string url
    const isLink = isXPostLinks(post);
    let postId: string = post;
    if (isLink) {
      const postIdGetter = this.extractPostIdFromUrl(post);
      if (!postIdGetter) {
        logger.error(`Invalid post URL: ${post}`);
        return null;
      }
      postId = postIdGetter;
    }
    console.log("postId: ", postId);

    // Sử dụng phương thức cached để tối ưu hiệu suất
    const data = await this.getCachedInfoPostXApi(postId);
    console.log("data: ", data);
    // const { likes, retweets, replies, author, thread } = data;
    // console.log("thread: ", thread);

    return data;
  }

  /**
   * Cached version of getInfoPostXApi - Fetches and caches post information from X API
   * Uses Redis for caching to reduce API calls and improve performance
   * @param postId ID của post cần lấy thông tin
   * @param maxResults Số lượng replies tối đa cần lấy (mặc định 100)
   * @param cacheTTL Thời gian cache hết hạn tính bằng giây (mặc định 1 giờ)
   * @returns Thông tin về post và replies của nó
   */
  async getCachedInfoPostXApi(
    postId: string,
    maxResults: number = 100,
    cacheTTL: number = 3600
  ): Promise<{
    success: boolean;
    data?: any;
    error?: string;
    replies?: any[];
    userMap?: Record<string, any>;
    fromCache?: boolean;
  }> {
    try {
      // Tạo khóa cache
      const cacheKey = `x_post_info:${postId}`;

      // Kiểm tra xem dữ liệu đã được cache chưa
      const cachedData = await redis.get(cacheKey);

      if (cachedData) {
        logger.info(`Using cached data for X post ${postId}`);
        return {
          ...cachedData,
          fromCache: true,
        };
      }

      // Nếu không có dữ liệu cache, gọi API để lấy thông tin
      logger.info(`Fetching fresh data for X post ${postId}`);
      const apiResult = await this.getInfoPostXApi(postId, maxResults);

      // Nếu API call thành công, lưu kết quả vào cache
      if (apiResult.success) {
        await redis.set(cacheKey, apiResult, cacheTTL);
        logger.info(
          `Cached X post data for ${postId}, expires in ${cacheTTL}s`
        );
      }

      return {
        ...apiResult,
        fromCache: false,
      };
    } catch (error: any) {
      logger.error(`Error in cached info post retrieval: ${error.message}`);
      return {
        success: false,
        error: `Failed to retrieve post info: ${error.message}`,
        fromCache: false,
      };
    }
  }

  /**
   * Xóa cache cho một post cụ thể
   * @param postId ID của post cần xóa khỏi cache
   * @returns Kết quả xóa cache
   */
  async invalidatePostCache(postId: string): Promise<boolean> {
    try {
      const cacheKey = `x_post_info:${postId}`;
      const result = await redis.del(cacheKey);

      if (result) {
        logger.info(`Cache invalidated for X post ${postId}`);
      } else {
        logger.info(`No cache found for X post ${postId}`);
      }

      return result;
    } catch (error: any) {
      logger.error(`Error invalidating cache: ${error.message}`);
      return false;
    }
  }
}

export default InteractXTgBot;
