import "dotenv/config";
import { ObjectId } from "mongodb";
import { logger } from "../utils/logger";
import { getCollection } from "../utils/mongoDb";
import { ITelegramUser, IXPost, IInteraction } from "../utils/interfaces";

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
   * Save a post from X to the database
   */
  async savePost({
    postId,
    postUrl,
    username,
    content,
    type = "member", // Default to member type if not specified
  }: SavePostParams): Promise<IXPost> {
    try {
      const postsCollection = getCollection<IXPost>("interactXTgPosts");

      // Check if post already exists
      const existingPost = await postsCollection.findOne({ postId });

      if (existingPost) {
        // Update existing post
        await postsCollection.updateOne(
          { postId },
          {
            $set: {
              postUrl,
              username,
              content,
              type,
              updatedAt: new Date(),
            },
          }
        );

        logger.success(`Post ${postId} updated for ${username}`);
        return {
          ...existingPost,
          postUrl,
          username,
          content,
          updatedAt: new Date(),
        };
      } else {
        // Create new post
        const newPost: IXPost = {
          postId,
          postUrl,
          username,
          content,
          interactionCount: 0, // Initialize interaction count
          type, // Add post type (member/admin)
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await postsCollection.insertOne(newPost);
        logger.success(`New post ${postId} saved for ${username}`);
        return newPost;
      }
    } catch (error: any) {
      logger.error(`Error saving post: ${error.message}`);
      throw new Error(`Failed to save post: ${error.message}`);
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

        const post = await this.savePost({
          postId,
          postUrl,
          username: xUsername,
          content: `Mock content for ${postUrl}`,
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
          const post = await this.savePost({
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
}

export default InteractXTgBot;
