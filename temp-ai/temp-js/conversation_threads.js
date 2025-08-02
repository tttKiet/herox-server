/**
 * conversation_threads.js
 *
 * Script để lấy danh sách người dùng reply cho một tweet sử dụng Conversation Threads API
 * API này có rate limit cao hơn Search API (75 requests/15-phút)
 */

(async function () {
  // Cấu hình
  const CONFIG = {
    // ID của tweet gốc muốn lấy replies
    tweetId: "1949846739038679481",

    // Bearer token cho xác thực
    bearerToken:
      "AAAAAAAAAAAAAAAAAAAAAL903QEAAAAAjqzJiv0l1hHLG3%2BwFnkARE0DiXM%3D5mROzYeFe0qE11mT7KRUToDLsiMkgyoH3aDkzvAXkoAcAC0njX",

    // Số lượng kết quả tối đa mỗi trang (tối đa 100)
    maxResultsPerPage: 100,

    // Số trang tối đa cần lấy
    maxPagesToFetch: 2,

    // Chế độ debug (hiển thị thông tin chi tiết)
    debug: true,

    // Số lần thử lại tối đa khi gặp lỗi
    maxRetries: 3,

    // Thời gian chờ ban đầu giữa các lần thử (ms)
    initialDelay: 5000,

    // Thời gian chờ giữa các trang (ms)
    pagingDelay: 1000,
  };

  /**
   * Utility function để đợi một khoảng thời gian
   * @param {number} ms - Thời gian đợi tính bằng milliseconds
   * @returns {Promise} Promise sẽ resolve sau khoảng thời gian xác định
   */
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  /**
   * Hàm log có điều kiện (chỉ log khi debug = true)
   * @param {string} message - Thông điệp cần log
   * @param {any} data - Dữ liệu kèm theo (optional)
   */
  const debugLog = (message, data) => {
    if (CONFIG.debug) {
      if (data !== undefined) {
        console.log(`[DEBUG] ${message}`, data);
      } else {
        console.log(`[DEBUG] ${message}`);
      }
    }
  };

  /**
   * Hàm chính để lấy danh sách users reply
   */
  async function fetchRepliesUsers() {
    console.log(
      `\n=== BẮT ĐẦU LẤY DANH SÁCH NGƯỜI DÙNG REPLY CHO TWEET ${CONFIG.tweetId} ===\n`
    );

    // Khởi tạo biến để lưu trữ kết quả
    const allTweets = [];
    const allUsers = {};
    let pagesProcessed = 0;
    let nextToken = null;
    let delay = CONFIG.initialDelay;

    // Base URL cho Conversation Threads API (quotes và replies)
    const baseUrl = `https://api.twitter.com/2/tweets/${CONFIG.tweetId}/tweet.fields=created_at,author_id,in_reply_to_user_id,conversation_id,referenced_tweets&expansions=author_id,referenced_tweets.id,in_reply_to_user_id&user.fields=name,username,profile_image_url,verified&max_results=${CONFIG.maxResultsPerPage}`;

    console.log(
      `Sử dụng API: Conversation Threads - Rate limit: 75 requests/15 phút`
    );
    console.log(`URL cơ sở: ${baseUrl}\n`);

    // Options cho request
    const options = {
      method: "GET",
      headers: {
        Authorization: `Bearer ${CONFIG.bearerToken}`,
        "User-Agent": "TwitterRepliesCollector/1.0",
      },
    };

    // Vòng lặp qua các trang kết quả
    while (pagesProcessed < CONFIG.maxPagesToFetch) {
      let attempt = 0;

      // Thêm next_token vào URL nếu có
      let url = baseUrl;
      if (nextToken) {
        url += `&next_token=${nextToken}`;
      }

      console.log(
        `\n=== ĐANG LẤY TRANG ${pagesProcessed + 1}/${
          CONFIG.maxPagesToFetch
        } ===`
      );
      debugLog(`URL đầy đủ`, url);

      // Vòng lặp thử lại khi gặp lỗi
      while (attempt <= CONFIG.maxRetries) {
        try {
          console.log(
            `\n> Lần thử ${attempt + 1}/${CONFIG.maxRetries + 1} cho trang ${
              pagesProcessed + 1
            }`
          );

          // Thực hiện request
          const response = await fetch(url, options);
          const headers = Object.fromEntries([...response.headers]);

          debugLog(`Status code: ${response.status}`);

          // Lấy thông tin rate limit từ headers
          const rateLimitInfo = {
            remaining: response.headers.get("x-rate-limit-remaining"),
            limit: response.headers.get("x-rate-limit-limit"),
            reset: response.headers.get("x-rate-limit-reset"),
          };

          if (rateLimitInfo.remaining && rateLimitInfo.limit) {
            console.log(
              `> Rate limit: ${rateLimitInfo.remaining}/${rateLimitInfo.limit} requests còn lại`
            );

            if (rateLimitInfo.reset) {
              const resetTime = new Date(parseInt(rateLimitInfo.reset) * 1000);
              console.log(`> Reset vào: ${resetTime.toLocaleTimeString()}`);
            }
          }

          // Xử lý lỗi rate limit
          if (response.status === 429) {
            attempt++;
            console.log(
              `\n⚠️ RATE LIMIT EXCEEDED (429) - Lần thử ${attempt}/${
                CONFIG.maxRetries + 1
              }`
            );

            if (attempt > CONFIG.maxRetries) {
              console.log("❌ Đã hết số lần thử lại. Dừng tiến trình.");
              break;
            }

            // Tính toán thời gian chờ
            let waitTime;
            const retryAfter = response.headers.get("retry-after");
            const rateLimitReset = response.headers.get("x-rate-limit-reset");

            if (rateLimitReset) {
              const resetTimestamp = parseInt(rateLimitReset) * 1000;
              const timeUntilReset = resetTimestamp - Date.now() + 1000; // Thêm 1s buffer
              waitTime = timeUntilReset;
              console.log(
                `> Rate limit sẽ reset sau ${Math.ceil(waitTime / 1000)} giây`
              );
            } else if (retryAfter) {
              waitTime = parseInt(retryAfter) * 1000;
              console.log(`> Đợi theo retry-after: ${waitTime / 1000} giây`);
            } else {
              waitTime = delay;
              delay *= 2; // Exponential backoff
              console.log(
                `> Không có thông tin reset, đợi ${waitTime / 1000} giây`
              );
            }

            // Đợi trước khi thử lại
            console.log(
              `> Đợi ${Math.ceil(waitTime / 1000)} giây trước khi thử lại...`
            );
            await sleep(waitTime);
            continue;
          }

          // Parse JSON response
          let data;
          try {
            const responseText = await response.text();
            data = JSON.parse(responseText);
            debugLog(`Raw response data`, data);
          } catch (parseError) {
            console.error(`❌ Lỗi khi parse JSON: ${parseError.message}`);
            attempt++;

            if (attempt > CONFIG.maxRetries) {
              console.log("❌ Đã hết số lần thử lại. Dừng tiến trình.");
              break;
            }

            await sleep(delay);
            delay *= 2;
            continue;
          }

          // Xử lý dữ liệu nếu thành công
          if (response.ok && data.data && data.data.length > 0) {
            // Cập nhật next_token cho phân trang
            nextToken =
              data.meta && data.meta.next_token ? data.meta.next_token : null;
            console.log(
              `> Next token: ${nextToken || "Không có (trang cuối)"}`
            );

            // Thêm tweets vào mảng kết quả
            allTweets.push(...data.data);

            // Lưu thông tin người dùng
            if (data.includes && data.includes.users) {
              data.includes.users.forEach((user) => {
                allUsers[user.id] = user;
              });
            }

            console.log(
              `✅ Đã thêm ${data.data.length} tweets từ trang ${
                pagesProcessed + 1
              }`
            );
            console.log(`> Tổng số tweets hiện tại: ${allTweets.length}`);
            console.log(
              `> Số người dùng đã thu thập: ${Object.keys(allUsers).length}`
            );

            // Tăng số trang đã xử lý
            pagesProcessed++;

            // Kiểm tra điều kiện dừng
            if (!nextToken || pagesProcessed >= CONFIG.maxPagesToFetch) {
              console.log("\n✅ Đã hoàn thành việc thu thập dữ liệu!");
              break;
            }

            // Đợi giữa các trang để tránh rate limit
            console.log(
              `\n> Đợi ${
                CONFIG.pagingDelay / 1000
              } giây trước khi lấy trang tiếp theo...`
            );
            await sleep(CONFIG.pagingDelay);
            break;
          } else {
            // Nếu không có dữ liệu hoặc gặp lỗi
            if (data.errors) {
              console.log(`❌ API trả về lỗi:`, data.errors);
            } else if (!data.data || data.data.length === 0) {
              console.log(`⚠️ Không có dữ liệu tweets được trả về`);
            }

            // Nếu không phải lỗi rate limit nhưng vẫn có lỗi, thử lại
            attempt++;

            if (attempt > CONFIG.maxRetries) {
              console.log("❌ Đã hết số lần thử lại. Dừng tiến trình.");
              break;
            }

            console.log(`> Thử lại sau ${delay / 1000} giây...`);
            await sleep(delay);
            delay *= 2;
          }
        } catch (error) {
          console.error(`❌ Lỗi khi fetch: ${error.message}`);

          attempt++;
          if (attempt > CONFIG.maxRetries) {
            console.log("❌ Đã hết số lần thử lại. Dừng tiến trình.");
            break;
          }

          console.log(`> Thử lại sau ${delay / 1000} giây...`);
          await sleep(delay);
          delay *= 2;
        }
      } // End retry loop

      // Nếu đã xử lý đủ trang hoặc không còn trang tiếp theo
      if (pagesProcessed >= CONFIG.maxPagesToFetch || !nextToken) {
        break;
      }
    } // End paging loop

    // Xử lý kết quả sau khi hoàn thành thu thập
    console.log(`\n\n=== KẾT QUẢ THU THẬP ===`);
    console.log(`Tổng số tweets đã thu thập: ${allTweets.length}`);
    console.log(`Tổng số người dùng: ${Object.keys(allUsers).length}`);

    if (allTweets.length > 0) {
      // Tạo danh sách tweets có thông tin user
      const tweetsWithUserInfo = allTweets.map((tweet) => {
        const author = allUsers[tweet.author_id] || {};

        return {
          id: tweet.id,
          text: tweet.text,
          created_at: tweet.created_at,
          author_id: tweet.author_id,
          author_username: author.username || "unknown",
          author_name: author.name || "Unknown User",
          author_verified: author.verified || false,
          profile_image: author.profile_image_url || null,
          referenced_tweets: tweet.referenced_tweets || [],
        };
      });

      // Filter để lấy ra chỉ các tweet thực sự là replies (không phải quotes)
      const actualReplies = tweetsWithUserInfo.filter((tweet) => {
        return (
          tweet.referenced_tweets &&
          tweet.referenced_tweets.some(
            (ref) => ref.type === "replied_to" && ref.id === CONFIG.tweetId
          )
        );
      });

      console.log(`\n=== PHÂN TÍCH KẾT QUẢ ===`);
      console.log(
        `Số tweets là replies trực tiếp: ${actualReplies.length}/${tweetsWithUserInfo.length}`
      );

      // Hiển thị danh sách người dùng đã reply
      console.log(`\n=== DANH SÁCH NGƯỜI DÙNG ĐÃ REPLY ===`);
      const uniqueUsers = {};

      actualReplies.forEach((tweet) => {
        if (!uniqueUsers[tweet.author_id]) {
          uniqueUsers[tweet.author_id] = {
            username: tweet.author_username,
            name: tweet.author_name,
            verified: tweet.author_verified,
            reply_count: 1,
          };
        } else {
          uniqueUsers[tweet.author_id].reply_count++;
        }
      });

      // Hiển thị thông tin người dùng
      const userList = Object.entries(uniqueUsers).map(([id, info]) => ({
        id,
        username: info.username,
        name: info.name,
        verified: info.verified,
        reply_count: info.reply_count,
      }));

      // Sắp xếp theo số lượng replies
      userList.sort((a, b) => b.reply_count - a.reply_count);

      console.log(`Số lượng người dùng đã reply: ${userList.length}`);
      console.log(`\nTop 10 người dùng tương tác nhiều nhất:`);

      userList.slice(0, 10).forEach((user, index) => {
        console.log(
          `${index + 1}. @${user.username} (${user.name})${
            user.verified ? " ✓" : ""
          } - ${user.reply_count} replies`
        );
      });

      // Hiển thị một số replies mẫu
      console.log(`\n=== MỘT SỐ REPLIES MẪU ===`);
      actualReplies.slice(0, 5).forEach((reply, index) => {
        console.log(`\n--- Reply #${index + 1} ---`);
        console.log(
          `From: @${reply.author_username} (${reply.author_name})${
            reply.author_verified ? " ✓" : ""
          }`
        );
        console.log(`Time: ${new Date(reply.created_at).toLocaleString()}`);
        console.log(`Text: ${reply.text}`);
      });

      // Trả về kết quả để có thể sử dụng sau này
      return {
        tweet_id: CONFIG.tweetId,
        total_replies: actualReplies.length,
        users: userList,
        replies: actualReplies,
      };
    } else {
      console.log(`❌ Không có dữ liệu nào được thu thập.`);
      return null;
    }
  }

  // Thực thi hàm chính
  try {
    const result = await fetchRepliesUsers();
    console.log("\n=== HOÀN THÀNH ===");
  } catch (error) {
    console.error(`\n❌ LỖI KHÔNG XỬ LÝ ĐƯỢC: ${error.message}`);
    console.error(error);
  }
})();
