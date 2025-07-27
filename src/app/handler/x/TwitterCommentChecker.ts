import { RequestHandler } from "express";
import { logger } from "../../../utils/logger";
import axios from "axios";

interface CheckCommentQuery {
  apiKey: string;
  tweetUrl: string;
  username: string;
  cookie?: string; // Cookie của tài khoản Twitter/X để gọi API
}

class CheckCommentHandler {
  constructor() {}

  /**
   * Handler để kiểm tra xem một người dùng đã comment vào tweet hay chưa
   * @param req Request với query chứa tweetUrl và username
   * @param res Response
   * @param next NextFunction
   */
  public checkUserComment: RequestHandler = async (req, res, next) => {
    try {
      const { apiKey, tweetUrl, username, cookie } =
        req.query as unknown as CheckCommentQuery;

      // Validate input parameters
      if (!apiKey) {
        res.status(401).json({
          ok: false,
          message: "Unauthorized: API key is required",
        });
        return;
      }

      if (!tweetUrl) {
        res.status(400).json({
          ok: false,
          message: "Bad Request: Tweet URL is required",
        });
        return;
      }

      if (!username) {
        res.status(400).json({
          ok: false,
          message: "Bad Request: Username is required",
        });
        return;
      }

      // Extract tweet ID and author from the tweet URL
      // Format: https://x.com/authorUsername/status/tweetId
      const tweetUrlRegex =
        /https:\/\/(?:x\.com|twitter\.com)\/([^/]+)\/status\/(\d+)/;
      const match = tweetUrl.match(tweetUrlRegex);

      if (!match) {
        res.status(400).json({
          ok: false,
          message: "Invalid tweet URL format",
        });
        return;
      }

      const [, tweetAuthor, tweetId] = match;

      // Gọi Twitter/X API để lấy replies của tweet
      logger.info(
        `Checking if user ${username} has commented on tweet ${tweetId} by ${tweetAuthor}`
      );

      // Sử dụng GraphQL API không chính thức của Twitter/X để lấy replies
      // API này không yêu cầu API key nhưng cần có cookie hợp lệ

      try {
        // Kiểm tra xem có cookie được cung cấp không
        if (!cookie && !process.env.TWITTER_COOKIE) {
          logger.error("Missing Twitter cookie");

          // Nếu không có cookie, thử sử dụng phương thức thay thế
          logger.info("No cookie provided, falling back to alternative method");
          const hasCommented = await this.checkCommentAlternative(
            tweetId,
            username
          );

          res.status(200).json({
            ok: true,
            data: {
              hasCommented,
              username,
              tweetId,
              tweetAuthor,
              tweetUrl,
              fallbackMethod: true,
              message: hasCommented
                ? `User ${username} has commented on the tweet (fallback method)`
                : `User ${username} has not commented on the tweet or comment not found (fallback method)`,
            },
          });
          return;
        }

        const twitterCookie = cookie || process.env.TWITTER_COOKIE || "";

        // Lấy guest token (cần thiết để gọi API GraphQL)
        const guestToken = await this.getGuestToken(twitterCookie);

        // Chuẩn bị yêu cầu GraphQL để lấy danh sách comment cho tweet
        // GraphQL API của Twitter cung cấp thông tin chi tiết hơn và hạn chế ít hơn so với API chính thức
        const searchUrl = `https://api.twitter.com/graphql/VaenaVgh5q5ih7kvyVjgtg/TweetDetail`;

        // Variables cho GraphQL query
        const variables = {
          focalTweetId: tweetId,
          with_rux_injections: false,
          includePromotedContent: false,
          withCommunity: false,
          withQuickPromoteEligibilityTweetFields: false,
          withBirdwatchNotes: false,
          withVoice: false,
          withV2Timeline: true,
        };

        // Features cho GraphQL query
        const features = {
          responsive_web_graphql_exclude_directive_enabled: true,
          verified_phone_label_enabled: false,
          responsive_web_home_pinned_timelines_enabled: true,
          creator_subscriptions_tweet_preview_api_enabled: true,
          responsive_web_graphql_timeline_navigation_enabled: true,
          responsive_web_graphql_skip_user_profile_image_extensions_enabled:
            false,
          c9s_tweet_anatomy_moderator_badge_enabled: true,
          tweetypie_unmention_optimization_enabled: true,
          responsive_web_edit_tweet_api_enabled: true,
          graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
          view_counts_everywhere_api_enabled: true,
          longform_notetweets_consumption_enabled: true,
          responsive_web_twitter_article_tweet_consumption_enabled: true,
          tweet_awards_web_tipping_enabled: false,
          freedom_of_speech_not_reach_fetch_enabled: true,
          standardized_nudges_misinfo: true,
          tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled:
            true,
          rweb_video_timestamps_enabled: true,
          longform_notetweets_rich_text_read_enabled: true,
          longform_notetweets_inline_media_enabled: true,
          responsive_web_media_download_video_enabled: false,
          responsive_web_enhance_cards_enabled: false,
        };

        // Headers cần thiết để gọi API GraphQL
        const headers = {
          Authorization:
            "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA",
          "x-guest-token": guestToken,
          "Content-Type": "application/json",
          Cookie: twitterCookie,
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          Referer: `https://twitter.com/${tweetAuthor}/status/${tweetId}`,
          "x-twitter-active-user": "yes",
          "x-twitter-client-language": "en",
        };

        // Gọi API GraphQL để lấy chi tiết tweet và các replies
        const response = await axios.get(searchUrl, {
          headers: headers,
          params: {
            variables: JSON.stringify(variables),
            features: JSON.stringify(features),
          },
        });

        // Phân tích kết quả để tìm comment của user
        const responseData = response.data;
        const instructions =
          responseData?.data?.threaded_conversation_with_injections_v2
            ?.instructions || [];

        // Tìm kiếm trong các entries để xác định xem user có comment hay không
        let foundComment = false;
        let userCommentData: any = null;

        // Duyệt qua các instructions để tìm timeline entries
        for (const instruction of instructions) {
          if (instruction.type === "TimelineAddEntries") {
            const entries = instruction.entries || [];

            // Duyệt qua các entries để tìm comment của user
            for (const entry of entries) {
              // Kiểm tra nếu entry là một tweet (reply)
              if (entry?.content?.itemContent?.tweet_results?.result) {
                const tweetResult =
                  entry.content.itemContent.tweet_results.result;
                const tweetUsername =
                  tweetResult?.core?.user_results?.result?.legacy?.screen_name?.toLowerCase();

                // So sánh username
                if (tweetUsername === username.toLowerCase()) {
                  foundComment = true;
                  userCommentData = {
                    id: tweetResult.rest_id || "",
                    text: tweetResult.legacy?.full_text || "",
                    created_at: tweetResult.legacy?.created_at || "",
                  };
                  break;
                }
              }
            }

            if (foundComment) break;
          }
        }

        // Cập nhật kết quả đã tìm thấy
        const hasCommented = foundComment;

        res.status(200).json({
          ok: true,
          data: {
            hasCommented,
            username,
            tweetId,
            tweetAuthor,
            tweetUrl,
            comment: userCommentData,
            useMethod: "cookie-graphql",
            message: hasCommented
              ? `User ${username} has commented on the tweet`
              : `User ${username} has not commented on the tweet or comment not found`,
          },
        });
      } catch (apiError: any) {
        logger.error(`Twitter API error: ${apiError.message}`);

        // Nếu không có quyền truy cập Twitter API hoặc rate limit, cung cấp thông tin chi tiết
        if (apiError.response) {
          logger.error(
            `Twitter API response status: ${apiError.response.status}`
          );
          logger.error(
            `Twitter API response data: ${JSON.stringify(
              apiError.response.data
            )}`
          );
        }

        // Alternative method if Twitter API is not available
        // Scrape Twitter search results (not recommended for production)
        logger.info(`Falling back to alternative method for checking comments`);

        try {
          // This is a simplified example. In reality, you would need a more robust approach
          // for scraping or using a third-party service that can check comments.
          const hasCommented = await this.checkCommentAlternative(
            tweetId,
            username
          );

          res.status(200).json({
            ok: true,
            data: {
              hasCommented,
              username,
              tweetId,
              tweetAuthor,
              tweetUrl,
              fallbackMethod: true,
              message: hasCommented
                ? `User ${username} has commented on the tweet (fallback method)`
                : `User ${username} has not commented on the tweet or comment not found (fallback method)`,
            },
          });
        } catch (fallbackError: any) {
          logger.error(`Fallback method failed: ${fallbackError.message}`);
          res.status(503).json({
            ok: false,
            message: "Unable to verify comment status at this time",
            error: "Service temporarily unavailable",
          });
        }
      }
    } catch (error: any) {
      logger.error(`Error in checkComment handler: ${error.message}`);
      res.status(500).json({
        ok: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  };

  /**
   * Lấy guest token từ Twitter để sử dụng trong các API calls
   * Guest token là cần thiết để gọi các GraphQL API của Twitter
   */
  private async getGuestToken(cookie: string): Promise<string> {
    try {
      const response = await axios.post(
        "https://api.twitter.com/1.1/guest/activate.json",
        {},
        {
          headers: {
            Authorization:
              "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA",
            Cookie: cookie,
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          },
        }
      );

      return response.data.guest_token;
    } catch (error: any) {
      logger.error(`Failed to get Twitter guest token: ${error.message}`);
      throw new Error("Failed to authenticate with Twitter");
    }
  }

  /**
   * Phương thức thay thế để kiểm tra comment nếu Twitter API không khả dụng
   * Lưu ý: Đây chỉ là một phương thức giả định và cần được triển khai thực tế
   */
  private async checkCommentAlternative(
    tweetId: string,
    username: string
  ): Promise<boolean> {
    // Đây là nơi bạn có thể triển khai một phương thức thay thế để kiểm tra comment
    // Ví dụ: Sử dụng puppeteer để scrape dữ liệu tweet, hoặc sử dụng dịch vụ của bên thứ ba

    // Trong ví dụ này, chúng tôi chỉ trả về kết quả giả định
    // Trong thực tế, bạn sẽ cần triển khai logic thực tế
    logger.info(
      `Using alternative method to check if ${username} commented on tweet ${tweetId}`
    );

    // Đây chỉ là một ví dụ mô phỏng
    return false;
  }
}

export default CheckCommentHandler;
