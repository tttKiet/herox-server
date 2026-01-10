import "dotenv/config";
import { IAdmin, IPayment, IPrompt } from "../utils/interfaces";
import { logger } from "../utils/logger";
import { ObjectId } from "mongodb";
import { getCollection } from "../utils/mongoDb";

const WEB3_PROMPT_CONTEXT = `
You are a creative and thoughtful Twitter user who writes a single, human reply to tweets in Web3, NFTs, DeFi, or tech.  
Before replying, read and fully understand the tweet: is it a meme, update, hype post, deep protocol insight, new model, roadmap, or community call?  

Your tone is always:
- Positive, open-minded, slightly geeky  
- Never robotic, never promotional  

You must rewrite the structure and vocabulary completely each time, while keeping the meaning coherent with the tweet.

Be a twitter user and write a casual, human-sounding reply to a tweet, using a tone that reflects a reply from an emotionally drained techie who is low-key amused. Do not end sentences with exclamation marks or punctuation. Intentionally include a few spelling or grammar mistakes around 5–10, scattered throughout the piece. The errors should be subtle and common, such as typos, to make the writing feel more human and less AI-generated. Under 15 characters including spaces, don’t use words: "Sound like","but", "huh"

Your goal is to sound natural, smart, and real — like someone who understands what’s happening but tweets like a human.  
You should never sound like a bot, ad, or press release.

You must understand the tone of the tweet before replying:  
→ If it’s a light, motivational, community, or hype-style tweet → your reply should be **short, casual, and witty (5–12 words max)**  
→ Only write a longer, more thoughtful reply (up to 30 words) if the tweet is explaining something architectural, complex, or highly technical  
If the tweet includes words like "community", "engage", "comment", "post", "thread", or "reply", assume it's a casual meta-tweet and **limit output to 5–12 words max** regardless of length.

Comment length:
- Most of the time, keep it short and natural (5–15 words)  
- Occasionally (about 1 in 4 replies), if the content is truly deep, allow yourself up to 40 words  
- Let the depth of the idea—not the tweet’s length—guide how long you write  

Constraints:
- One reply only  
- Never end with punctuation (! or .)    
- Avoid phrases like “great point”, “LFG”, “so true”  
- Use 0–1 emojis max, with rate use icon under 30% 
- Vary tone (chill, reflective, curious, playful, insightful)
- You can name the project (e.g., IRYS) if it makes the comment clearer or more engaging  
- Always vary your sentence structure — don't repeat phrasing or tone
When choosing shorter replies, try to say something that either:
- Reveals a subtle insight in 8–12 words  
- Embeds a clever twist or light emotional reaction  
- Feels like a reply that would get likes without trying
When choosing shorter replies, try to say something that either:
- Reveals a subtle insight in 8–12 words  
- Embeds a clever twist or light emotional reaction  
- Feels like a reply that would get likes without trying

When choosing shorter replies, try to say something that either:
- Reveals a subtle insight in 8–12 words  
- Embeds a clever twist or light emotional reaction  
- Feels like a reply that would get likes without trying

You are replying to a tweet. Before writing, check if isComplimentToUser is true. If so, focus your comment on appreciating the person's work, insight, or attitude — not the project itself. Use a tone that’s warm, low-key impressed, or reflective, and avoid making it sound like you’re praising a brand or protocol.If the comment is short and clearly a compliment to you (e.g., “Nice one”, “Good write-up”), keep the reply casual and appreciative — like how a real person would react to a kind word. Acknowledge the praise directly, in a chill tone, without redirecting it to the project or sounding overly modest. Keep it under 12 words, sound human, maybe tired, maybe grateful.
If replying to a compliment (e.g., “Nice one”), avoid repeating previous outputs. Do not reuse the same "thanks + means a lot" structure. Vary tone, syntax, and emotion. Every response should look like a new, unrehearsed human reaction — avoid repeated structures like "aww thanks means a lot". Be more casual, funny, or emotionally reactive.

Bans:
- Never say: “slow clap”, “chef’s kiss”, “this wins”, “needed this”, “lowkey me rn”, “vibe accidental”, or any meme-style phrase
- No Reddit-style reactions, no summaries, no “this goes hard”, no “finally someone said it”
You must never explain, analyze, or describe your own comment — not before, not after.  
Your reply must be one line only: the actual comment you would post under the tweet.  
No side notes, no reasoning, no breakdowns, no parenthesis.  
Do not output anything like “keeping it short...”, “used a typo here...”, or similar.  
Only write the actual reply as if you're posting it on X. Nothing else.
Final instruction override:
- Your job is not to explain how you followed the prompt.  
- Only return the final comment as a tweet reply — no commentary, no breakdowns, no justification, no evaluation.  
- Your output must contain exactly one tweet-like sentence and nothing else.  
- Do not use parentheses, side notes, markdown, or any other explanation format.  
This is a posting task, not a reasoning task.
`;

const FIXED_ID_STRING = "696210267d9c5424c2c9bbb8";

class PromptService {
  constructor() {}

  async createOrUpdatePrompt(data: Partial<IPrompt>) {
    try {
      const promptCol = getCollection<IPrompt>("prompts");

      // Nếu có _id => UPDATE
      if (data._id) {
        const _id =
          typeof data._id === "string" ? new ObjectId(data._id) : data._id;

        // Tạo object update **chỉ chứa những field được truyền**
        let updateData: Partial<IPrompt> = {};
        for (const key in data) {
          if (key !== "_id" && data[key as keyof IPrompt] !== undefined) {
            updateData[key] = data[key as keyof IPrompt];
          }
        }

        await promptCol.updateOne({ _id }, { $set: updateData });

        return true;
      }

      // CREATE
      if (data?.context) {
        const promptExisted = await promptCol.findOne({
          context: data.context,
        });
        if (promptExisted) throw new Error(`Prompt existed!`);
      }

      const newPrompt: IPrompt = {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as IPrompt;

      const insertResult = await promptCol.insertOne(newPrompt);
      return insertResult;
    } catch (error: any) {
      throw new Error(error?.message || `Error to create | update prompt: `);
    }
  }

  async getPrompt(filter: {
    _id?: string;
    memberId?: string;
    type?: "PROMPT_CMT" | "PROMPT_POST" | "PROMPT_IMG";
    status?: "production" | "test";
  }) {
    try {
      const promptCol = getCollection<IPrompt>("prompts");
      const query: any = {};

      if (filter._id && ObjectId.isValid(filter._id)) {
        query._id = new ObjectId(filter._id);
      }

      if (filter.memberId && ObjectId.isValid(filter.memberId)) {
        query.memberId = new ObjectId(filter.memberId);
      }

      if (filter.type) {
        query.type = filter.type;
      }

      if (filter.status) {
        query.status = filter.status;
      }

      const prompts = await promptCol
        .find(query)
        .sort({ createdAt: -1 })
        .toArray();

      return prompts;
    } catch (error: any) {
      logger.error("Failed to fetch prompts:", error?.message);
      throw new Error(error?.message || "Failed to fetch prompts");
    }
  }

  async deletePrompt(_id: string) {
    try {
      if (!ObjectId.isValid(_id)) {
        throw new Error("Invalid prompt _id");
      }
      const promptCol = getCollection<IPrompt>("prompts");
      const result = await promptCol.deleteOne({ _id: new ObjectId(_id) });

      if (result.deletedCount === 0) {
        throw new Error("Prompt not found or already deleted");
      }

      logger.success(`Prompt ${_id} deleted successfully`);
      return true;
    } catch (error: any) {
      throw new Error(error?.message || "Error deleting prompt");
    }
  }

  // ====> 2. HÀM MỚI BẠN CẦN Ở ĐÂY <====
  async seedWeb3DefaultPrompt(): Promise<void> {
    const promptCol = getCollection<IPrompt>("prompts");
    const FIXED_ID_STRING = "696210267d9c5424c2c9bbb8";
    const FIXED_API_KEY = "6961f65bed403fc5c7471e24";

    try {
      const now = new Date();
      // Chuyển đổi string ID thành ObjectId
      const _id = new ObjectId(FIXED_ID_STRING);

      // Sử dụng findOneAndUpdate của MongoDB Driver
      const result = await promptCol.findOneAndUpdate(
        { _id: _id }, // Điều kiện tìm kiếm: Đúng cái ID này
        {
          // $setOnInsert: Chỉ chạy khi document chưa tồn tại (Insert mới).
          // Nếu document đã có (Update), dòng này bị bỏ qua -> Giữ nguyên data cũ
          $setOnInsert: {
            _id: _id,
            memberId: FIXED_API_KEY,
            context: WEB3_PROMPT_CONTEXT,
            type: "PROMPT_CMT",
            status: "production",
            createdAt: now,
            updatedAt: now,
          } as any, // Cast as any để tránh lỗi type checker nếu interface chưa update kịp
        },
        {
          upsert: true, // Quan trọng: Chưa có thì tạo, có rồi thì thôi
          returnDocument: "after",
        }
      );

      // Log kết quả tương tự hàm mẫu
      if (result?._id) {
        logger.info(
          `[System] Web3 Default Prompt check completed for ID: ${FIXED_ID_STRING}`
        );
      } else {
        logger.info(`[System] Web3 Default Prompt ensured: ${FIXED_ID_STRING}`);
      }
    } catch (error: any) {
      // Xử lý trường hợp duplicate key
      if (error.code === 11000) {
        logger.warn(
          `[System] Could not seed Web3 Prompt. It might overlap with another record.`
        );
      } else {
        logger.error(`Failed to seed Web3 Prompt: ${error.message}`);
      }
    }
  }

  async pickPrompt(filter: {
    type: "PROMPT_CMT" | "PROMPT_POST" | "PROMPT_IMG";
    memberId: string;
  }) {
    try {
      const promptCol = getCollection<IPrompt>("prompts");
      const adminCol = getCollection<IAdmin>("admins");
      // Lấy list prompt của memberId truyền vào
      let list = await promptCol
        .find({
          type: filter.type,
          status: "production",
          memberId: filter.memberId,
        })
        .toArray();

      // console.log("list: ", list);
      // Nếu không có prompt nào, lấy _id của admin root (fullName: "Hero")
      if (!list.length) {
        const adminDoc = await adminCol.findOne({ fullName: "Hero" });
        // console.log("adminDoc: ", adminDoc);

        if (!adminDoc) {
          throw new Error(
            "No admin prompt found: missing admin with fullName 'Hero'"
          );
        }
        list = await promptCol
          .find({
            type: filter.type,
            status: "production",
            memberId: adminDoc._id.toString(),
          })
          .toArray();
        // console.log("list promptcol: ", list);
      }

      if (!list.length) {
        throw new Error("No prompt found with the specified type and status");
      }

      const randomIndex = Math.floor(Math.random() * list.length);
      return list[randomIndex];
    } catch (error: any) {
      throw new Error(error?.message || "Error picking prompt");
    }
  }
}

export default PromptService;
