import { Scenes } from "telegraf";
import { message } from "telegraf/filters";
import { logger } from "../../../../utils/logger";
import {
  BUTTONS,
  COMMANDS,
  KEYBOARDS,
  MESSAGES,
} from "../../../../utils/constants/botCommands";
import { NAV_KEYBOARDS } from "../../../../utils/constants/navKeyboards";
import { TaskManager } from "../../../../class";
import { ITelegramUser, IXPost, ITaskLink } from "../../../../utils/interfaces";
import { getCollection } from "../../../../utils/mongoDb";
import { ObjectId } from "mongodb";

/**
 * Kiểm tra xem một link đã đủ tương tác chưa
 */
function isLinkCompleted(post: IXPost): boolean {
  return (post.interactionCount || 0) >= (post.requiredInteractionCount || 5);
}

/**
 * Tạo thanh tiến trình bằng text
 */
function createProgressBar(
  current: number,
  total: number,
  length: number = 10
): string {
  const filledChar = "█";
  const emptyChar = "░";

  if (total <= 0) total = 1; // Tránh chia cho 0
  if (current > total) current = total; // Giới hạn giá trị tối đa

  const percentage = current / total;
  const filledLength = Math.round(length * percentage);
  const emptyLength = length - filledLength;

  return filledChar.repeat(filledLength) + emptyChar.repeat(emptyLength);
}

/**
 * Lấy danh sách links của một username từ cơ sở dữ liệu
 */
async function getUserLinks(
  telegramUserId: string,
  username: string
): Promise<IXPost[]> {
  try {
    const postsCollection = getCollection<IXPost>("interactXTgPosts");
    return await postsCollection
      .find({ username: username.toLowerCase() })
      .sort({ createdAt: -1 }) // Sắp xếp theo thời gian tạo giảm dần (mới nhất trước)
      .toArray();
  } catch (error) {
    logger.error(`Error getting links for user ${username}: ${error}`);
    return [];
  }
}

// Scene for showing user's links and progress
const myLinksScene = new Scenes.BaseScene<any>("my-links");

// Handler for cancel button
myLinksScene.action("cancel_mylinks", async (ctx) => {
  try {
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.reply(MESSAGES.CANCEL_OPERATION, {
      reply_markup: KEYBOARDS.MAIN,
    });
    return ctx.scene.leave();
  } catch (error) {
    logger.error(`Error in cancel_mylinks action: ${error}`);
  }
});

// Handler when entering the scene
myLinksScene.enter(async (ctx) => {
  const telegramId = ctx.from?.id?.toString();

  // Check if user's ID is available
  if (!telegramId) {
    await ctx.reply(
      `❌ Could not identify your account. Please try again or contact support.`,
      {
        reply_markup: {
          ...KEYBOARDS.MAIN,
          inline_keyboard: NAV_KEYBOARDS.START_MENU.inline_keyboard,
        },
      }
    );
    return ctx.scene.leave();
  }

  try {
    // Hiển thị thông báo đang tải
    const loadingMessage = await ctx.reply("⏳ Loading your links list...");
    
    // Get user data from database
    const usersCollection = getCollection<ITelegramUser>("interactXTgUsers");
    const userData = await usersCollection.findOne({ userId: telegramId });

    // Check if user has set up profile
    if (
      !userData ||
      !userData.registeredUsernames ||
      userData.registeredUsernames.length === 0
    ) {
      // Xóa tin nhắn loading
      await ctx.telegram.deleteMessage(ctx.chat.id, loadingMessage.message_id);
      
      await ctx.reply(
        `❌ You haven't set up your profile yet. Please use ${COMMANDS.SETUP} command first.`,
        {
          reply_markup: {
            ...KEYBOARDS.MAIN,
            inline_keyboard: NAV_KEYBOARDS.START_MENU.inline_keyboard,
          },
        }
      );
      return ctx.scene.leave();
    }

    const usernames = userData.registeredUsernames;
    let totalLinks = 0;
    let pendingLinks = 0;
    let completedLinks = 0;
    let foundLinks = false;

    // Danh sách summary cho mỗi username
    const usernameSummaries: string[] = [];

    // Xử lý từng username của người dùng
    for (const username of usernames) {
      // Lấy tất cả posts của username từ interactXTgPosts
      const userPosts = await getUserLinks(telegramId, username);
      
      if (userPosts && userPosts.length > 0) {
        foundLinks = true;
        totalLinks += userPosts.length;
        
        // Đếm số lượng link đã hoàn thành và chưa hoàn thành
        const completed = userPosts.filter(post => isLinkCompleted(post));
        completedLinks += completed.length;
        pendingLinks += userPosts.length - completed.length;
        
        // Tạo thông báo cho username này
        let usernameSummary = `\n<b>@${username}</b>: `;
        
        // Lọc ra các link chưa đủ tương tác
        const pendingPosts = userPosts.filter(post => !isLinkCompleted(post));
        
        if (pendingPosts.length > 0) {
          usernameSummary += `<b>${pendingPosts.length}/${userPosts.length}</b> links need more interactions\n`;
          
          // Hiển thị tất cả các link chưa đủ tương tác
          pendingPosts.forEach((post, index) => {
            const shortUrl = post.postUrl.replace(/https?:\/\/(www\.)?(twitter|x)\.com\//i, '');
            const progressBar = createProgressBar(
              post.interactionCount || 0,
              post.requiredInteractionCount || 5,
              5  // Thanh tiến trình ngắn hơn để hiển thị gọn
            );
            
            usernameSummary += `${index + 1}. ${shortUrl}\n   ${progressBar} (${post.interactionCount || 0}/${post.requiredInteractionCount || 5})\n`;
          });
        } else {
          usernameSummary += `✅ All ${userPosts.length} links completed\n`;
        }
        
        usernameSummaries.push(usernameSummary);
      }
    }

    // Xóa tin nhắn loading
    await ctx.telegram.deleteMessage(ctx.chat.id, loadingMessage.message_id);

    // Nếu tìm thấy links
    if (foundLinks) {
      // Tạo tổng quan
      let overviewMessage = `📊 <b>Your Links List</b>\n\n`;
      overviewMessage += `- <b>Total links:</b> ${totalLinks}\n`;
      overviewMessage += `- <b>Completed:</b> ${completedLinks}\n`;
      overviewMessage += `- <b>Pending interactions:</b> ${pendingLinks}\n`;
      
      // Thêm thông tin chi tiết cho mỗi username
      overviewMessage += `\n<b>Your links by username:</b>`;
      overviewMessage += usernameSummaries.join('\n');
      
      // Thêm hướng dẫn
      if (pendingLinks > 0) {
        overviewMessage += `\n\nℹ️ <i>Below is the list of your links that need more interactions.</i>\n`;
      }
      
      // Tạo inline keyboard với các nút điều hướng theo yêu cầu
      const inlineKeyboard = [
        [
          { text: "🔄 Update Link", callback_data: "refresh_links" },
          { text: "🔗 Post Link", callback_data: "post_links" },
        ],
        [
          { text: "💰 Credits", callback_data: "view_credits" },
          { text: "👤 My Profile", callback_data: "view_profile" },
        ],
        [
          { text: "❓ Help", callback_data: "show_help" },
          { text: "❌ Close", callback_data: "cancel_mylinks" },
        ],
      ];

      // Gửi thông điệp với nút điều hướng
      await ctx.reply(overviewMessage, {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: inlineKeyboard,
        }
      });
    } else {
      // Nếu không tìm thấy links nào
      await ctx.reply(
        `📊 <b>Your Links</b>\n\n` +
        `You haven't posted any links yet.\n\n` +
        `To post links, use "${COMMANDS.POST}" command or "${BUTTONS.POST_LINKS}" button.`,
        {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [{ text: "🔗 Post Links", callback_data: "post_links" }],
              [{ text: "❌ Close", callback_data: "cancel_mylinks" }]
            ]
          }
        }
      );
    }

    // Không thoát scene để cho phép người dùng tương tác với các nút
  } catch (error) {
    logger.error(`Error in myLinksScene: ${error}`);
    await ctx.reply(
      `❌ <b>Error</b>\n\nCould not fetch your links: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      {
        parse_mode: "HTML",
        reply_markup: {
          ...KEYBOARDS.MAIN,
          inline_keyboard: NAV_KEYBOARDS.START_MENU.inline_keyboard,
        },
      }
    );
    return ctx.scene.leave();
  }
});

// Handler cho nút Credits
myLinksScene.action("view_credits", async (ctx) => {
  try {
    await ctx.answerCbQuery("Viewing your credits");
    
    // Lấy thông tin credit của user
    const telegramId = ctx.from?.id?.toString();
    if (!telegramId) {
      await ctx.reply("❌ Could not identify your account");
      return;
    }
    
    // Lấy dữ liệu từ collection credits hoặc tương tự
    // Nếu không có collection riêng, mặc định là 0
    let credits = 0;
    
    try {
      // Thử lấy từ user data nếu có
      const usersCollection = getCollection<ITelegramUser>("interactXTgUsers");
      const userData = await usersCollection.findOne({ userId: telegramId });
      
      // Nếu có collection riêng cho credits, lấy từ đó
      const creditsCollection = getCollection("interactXTgCredits");
      const creditsData = await creditsCollection.findOne({ userId: telegramId });
      
      if (creditsData && creditsData.amount) {
        credits = creditsData.amount;
      }
    } catch (e) {
      // Xử lý lỗi không tìm thấy collection
      logger.error(`Failed to fetch credits: ${e}`);
    }
    
    // Hiển thị thông tin credits
    await ctx.reply(
      `💰 <b>Your Credits</b>\n\n` +
      `Current balance: <b>${credits}</b> credits\n\n` +
      `You can earn more credits by interacting with other users' posts.`,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔙 Back", callback_data: "back_to_overview" }]
          ]
        }
      }
    );
  } catch (error) {
    logger.error(`Error in view_credits action: ${error}`);
    await ctx.reply("Error occurred while fetching your credits", {
      reply_markup: KEYBOARDS.MAIN
    });
  }
});

// Handler cho nút My Profile
myLinksScene.action("view_profile", async (ctx) => {
  try {
    await ctx.answerCbQuery("Viewing your profile");
    
    const telegramId = ctx.from?.id?.toString();
    if (!telegramId) {
      await ctx.reply("❌ Could not identify your account");
      return;
    }
    
    const usersCollection = getCollection<ITelegramUser>("interactXTgUsers");
    const userData = await usersCollection.findOne({ userId: telegramId });
    
    if (!userData) {
      await ctx.reply("❌ Profile not found. Please set up your profile first.");
      return;
    }
    
    // Tạo thông tin profile
    const usernames = userData.registeredUsernames || [];
    
    // Khởi tạo giá trị mặc định
    let credits = 0;
    let totalLinks = 0;
    let totalInteractions = 0;
    
    try {
      // Tìm số lượng links đã đăng
      const postsCollection = getCollection("interactXTgPosts");
      const linkCount = await postsCollection.countDocuments({ 
        createdBy: telegramId 
      });
      totalLinks = linkCount || 0;
      
      // Tìm số lượng tương tác đã thực hiện
      const interactionsCollection = getCollection("interactXTgInteractions");
      const interactionCount = await interactionsCollection.countDocuments({
        userId: telegramId
      });
      totalInteractions = interactionCount || 0;
      
      // Tìm số credits
      const creditsCollection = getCollection("interactXTgCredits");
      const creditsData = await creditsCollection.findOne({ userId: telegramId });
      if (creditsData && creditsData.amount) {
        credits = creditsData.amount;
      }
    } catch (e) {
      logger.error(`Failed to fetch user stats: ${e}`);
    }
    
    const profileMessage = 
      `👤 <b>Your Profile</b>\n\n` +
      `<b>Telegram:</b> @${ctx.from?.username || "Not set"}\n` +
      `<b>X/Twitter:</b> ${usernames.map(u => `@${u}`).join(", ") || "Not set"}\n\n` +
      `<b>Stats:</b>\n` +
      `- Credits: ${credits}\n` +
      `- Total links posted: ${totalLinks}\n` +
      `- Total interactions: ${totalInteractions}\n`;
    
    await ctx.reply(profileMessage, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "✏️ Edit Profile", callback_data: "edit_profile" },
            { text: "🔙 Back", callback_data: "back_to_overview" }
          ]
        ]
      }
    });
  } catch (error) {
    logger.error(`Error in view_profile action: ${error}`);
    await ctx.reply("Error occurred while fetching your profile", {
      reply_markup: KEYBOARDS.MAIN
    });
  }
});

// Handler cho nút Help
myLinksScene.action("show_help", async (ctx) => {
  try {
    await ctx.answerCbQuery("Showing help information");
    
    const helpMessage = 
      `ℹ️ <b>Help Guide</b>\n\n` +
      `<b>Main Commands:</b>\n` +
      `- /start - Start the bot\n` +
      `- /setup - Set up your profile\n` +
      `- /post - Post new links\n` +
      `- /links - View your links\n` +
      `- /interact - Check interactions\n\n` +
      
      `<b>How it works:</b>\n` +
      `1. Set up your profile with your X/Twitter usernames\n` +
      `2. Post your links\n` +
      `3. Interact with other users' links to earn credits\n` +
      `4. Use credits to post more links\n\n` +
      
      `For more detailed information, contact our support team.`;
    
    await ctx.reply(helpMessage, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔙 Back", callback_data: "back_to_overview" }]
        ]
      }
    });
  } catch (error) {
    logger.error(`Error in show_help action: ${error}`);
    await ctx.reply("Error occurred while showing help information", {
      reply_markup: KEYBOARDS.MAIN
    });
  }
});

// Handler cho nút Edit Profile (chuyển hướng đến scene setup)
myLinksScene.action("edit_profile", async (ctx) => {
  try {
    await ctx.answerCbQuery("Redirecting to profile setup");
    await ctx.scene.leave();
    return ctx.scene.enter("setup");
  } catch (error) {
    logger.error(`Error in edit_profile action: ${error}`);
    await ctx.reply("Error occurred while redirecting to profile setup", {
      reply_markup: KEYBOARDS.MAIN
    });
    return ctx.scene.leave();
  }
});

// Handler cho nút kiểm tra tương tác
myLinksScene.action("check_interactions", async (ctx) => {
  try {
    await ctx.answerCbQuery("Redirecting to check interactions feature");
    await ctx.scene.leave();
    return ctx.scene.enter("check-interactions");
  } catch (error) {
    logger.error(`Error in check_interactions action: ${error}`);
    await ctx.reply("Error occurred while redirecting to check interactions feature", {
      reply_markup: KEYBOARDS.MAIN
    });
    return ctx.scene.leave();
  }
});

// Handler cho nút đăng links
myLinksScene.action("post_links", async (ctx) => {
  try {
    await ctx.answerCbQuery("Redirecting to post links feature");
    await ctx.scene.leave();
    return ctx.scene.enter("post-links");
  } catch (error) {
    logger.error(`Error in post_links action: ${error}`);
    await ctx.reply("Error occurred while redirecting to post links feature", {
      reply_markup: KEYBOARDS.MAIN
    });
    return ctx.scene.leave();
  }
});

// Handler cho nút refresh (cập nhật)
myLinksScene.action("refresh_links", async (ctx) => {
  try {
    await ctx.answerCbQuery("Updating links list...");
    
    // Xóa tin nhắn cũ và chạy lại scene
    if (ctx.callbackQuery.message) {
      await ctx.deleteMessage(ctx.callbackQuery.message.message_id);
    }
    
    // Gọi lại hàm enter
    return ctx.scene.reenter();
  } catch (error) {
    logger.error(`Error in refresh_links action: ${error}`);
    await ctx.reply("Error occurred while updating links list", {
      reply_markup: KEYBOARDS.MAIN
    });
  }
});

// Handler cho nút quay lại tổng quan
myLinksScene.action("back_to_overview", async (ctx) => {
  try {
    await ctx.answerCbQuery("Back to overview");

    // Xóa tin nhắn hiện tại
    if (ctx.callbackQuery.message) {
      await ctx.deleteMessage(ctx.callbackQuery.message.message_id);
    }

    // Gọi lại hàm enter để hiển thị tổng quan
    return ctx.scene.reenter();
  } catch (error) {
    logger.error(`Error in back_to_overview action: ${error}`);
    await ctx.reply("Error occurred while returning to overview", {
      reply_markup: KEYBOARDS.MAIN
    });
  }
});

// Handler cho tin nhắn text
myLinksScene.on(message("text"), async (ctx) => {
  // Kiểm tra các lệnh
  const text = ctx.message.text;
  
  if (text === "/cancel" || text.toLowerCase() === "cancel") {
    await ctx.reply(MESSAGES.CANCEL_OPERATION, {
      reply_markup: KEYBOARDS.MAIN
    });
    return ctx.scene.leave();
  }
  
  // Nếu không phải lệnh đặc biệt, hiển thị hướng dẫn
  await ctx.reply(
    "Use the buttons below to view information or type /cancel to exit.",
    { reply_markup: KEYBOARDS.MAIN }
  );
});

export { myLinksScene };
