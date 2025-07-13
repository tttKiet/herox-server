import { RequestHandler } from "express";
import GpmHandler from "../../../class/GpmHandler";
import { logger } from "../../../utils/logger";
import puppeteer from "puppeteer";
import { IFunctionHandler } from "../../../utils";
import { IPost, IPostReg, IUserInteractPost } from "../../../utils/interfaces";
import N8nHelper from "../../../class/N8nHelper";
import { ObjectId } from "mongodb";
import { getCollection } from "../../../utils/mongoDb";
import {
  doesFolderExist,
  getRandomImageBase64,
  saveHostedImageToStore,
} from "../../../utils/store-img";
import Payment from "../../../class/Payment";
import PromptService from "src/class/PromptService";

const payment = new Payment();

class XHandler {
  constructor() {}

  public scrape: RequestHandler<{ username: string }> = async function (
    req,
    res
  ) {
    const { username } = req.params;

    const gpmHandler = new GpmHandler();
    const respStartProfile = await gpmHandler.startProfile(
      "cdc5d866-f4f2-4ec2-b9de-e20b670f0caf"
    );
    if (!respStartProfile) {
      res.status(400).json({
        succes: false,
        message: "Error while open profile",
      });

      return;
    } else {
      await gpmHandler.waitForJsonVersion(
        respStartProfile?.remote_debugging_address
      );
    }
    const url = `https://x.com/${username}`;
    let browser;

    try {
      // Kết nối tới trình duyệt đã bật Remote Debugging
      logger.info("Init connect gpm...");
      browser = await puppeteer.connect({
        browserURL: `http://${respStartProfile?.remote_debugging_address}`,
        defaultViewport: null,
      });
      // Lấy tab đầu tiên nếu đã có, không mở tab mới
      const pages = await browser.pages();
      const page = pages.length > 0 ? pages[0] : await browser.newPage();

      await page.goto(url, { waitUntil: "networkidle2" });

      // Kiểm tra xem có bị redirect tới login không
      if (page.url().includes("/i/flow/login")) {
        throw new Error(
          "Profile chưa đăng nhập X. Vui lòng đăng nhập trên trình duyệt trước khi scrape."
        );
      }

      await page.waitForSelector('[data-testid="tweet"]', { timeout: 16000 });
      const postLimit = 10;
      const posts: {
        content: string | null;
        timestamp: string | null;
        images: string[];
      }[] = [];
      let lastHeight = await page.evaluate(() => document.body.scrollHeight);

      while (true) {
        const tweetEls = await page.$$('[data-testid="tweet"]');

        for (const el of tweetEls) {
          logger.info("Element: " + el);
          // Lấy timestamp để tránh lặp
          const timestamp = await el.$eval("time", (node) =>
            node.getAttribute("datetime")
          );
          if (!timestamp || posts.some((p) => p.timestamp === timestamp))
            continue;

          // Lấy nội dung từ div[data-testid="tweetText"] bên trong el
          const content = await el.evaluate((node) => {
            const textNode = node.querySelector('[data-testid="tweetText"]');
            return textNode?.textContent?.trim() || null;
          });

          // Lấy tất cả ảnh trong bài
          const images = await el.$$eval("img[src]", (imgs) =>
            imgs.map((i) => i.getAttribute("src") || "").filter((src) => !!src)
          );
          posts.push({
            timestamp,
            content,
            images: images,
          });
          logger.info("Content: " + content);
        }
        console.log("Length: ", posts.length);

        if (posts.length >= postLimit) break;

        // Scroll xuống để load thêm
        await page.evaluate(() =>
          window.scrollTo(0, document.body.scrollHeight)
        );
        await new Promise((resolve) => setTimeout(resolve, 4000));
        const newHeight = await page.evaluate(() => document.body.scrollHeight);
        if (newHeight === lastHeight) break; // không còn nội dung mới
        lastHeight = newHeight;
      }

      res.status(200).json({ user: username, posts });
      return;
    } catch (err: any) {
      console.error("Error:", err.message);
      res.status(500).json({ error: err.message });
      return;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  };

  public reupPost: RequestHandler<IPostReg> = async function (req, res) {
    const { userMessage, folderName, isCreateImg, accountVerified, apiKey } =
      req.body;

    if (
      !userMessage ||
      !folderName ||
      isCreateImg == undefined ||
      accountVerified == undefined
    ) {
      console.log("Missing parameters body: ", req.body);

      res.status(400).json({
        ok: false,
        message: "Missing parameters body!",
      });
      return;
    }

    try {
      // Create Task and save in mongo db
      const post: IPost = {
        status: "pending",
        memberId: apiKey,
        content: "",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const postsCol = getCollection<IPost>("posts");
      const { insertedId } = await postsCol.insertOne(post);
      // logger.success(`Post -> success.`);

      res.status(200).json({
        ok: true,
        message: "Task post created successfully!",
        data: {
          id: insertedId,
        },
      });

      createPost(
        {
          insertedId,
          userMessage,
          folderName,
        },
        apiKey
      );
      return;
    } catch (err: any) {
      console.error("Error:", err.message);
      res.status(500).json({ error: err.message });
      return;
    }
  };

  public getPostById: RequestHandler<{ id: string }> = async function (
    req,
    res
  ) {
    const { id } = req.params;

    try {
      const postsCol = getCollection<IPost>("posts");
      const postDocs = await postsCol.findOne({ _id: new ObjectId(id) });

      res.status(200).json({
        ok: true,
        data: postDocs,
      });
      return;
    } catch (err: any) {
      console.error("Error:", err.message);
      res.status(500).json({ error: err.message });
      return;
    } finally {
    }
  };

  public saveLinkInteract: RequestHandler<Partial<IUserInteractPost>> =
    async function (req, res) {
      const { postId, action, authorUsername, targetUsername } = req.body;

      if (!postId || !authorUsername || !targetUsername) {
        res.status(400).json({ ok: false, message: "Missing input!" });
        return;
      }
      // convert input
      const urlArray = postId.split("/");
      const postIdString = urlArray[urlArray.length - 1];

      const lastPostId = postIdString.split("?")[0];
      // logger.info("Save post id: ", lastPostId);

      const lastAuthorUsername = authorUsername.toLowerCase().trim();
      const lastTargetUsername = targetUsername.toLowerCase().trim();

      try {
        const interactPostCol =
          getCollection<IUserInteractPost>("interactPosts");
        const postDocs = await interactPostCol.findOne({
          postId: lastPostId,
          authorUsername: lastAuthorUsername,
        });
        if (postDocs) {
          // return success
          res.status(200).json({
            ok: true,
            data: postDocs,
          });
          return;
        }

        // create doc
        const postInteract: IUserInteractPost = {
          authorUsername: lastAuthorUsername,
          action: action ? "commented" : undefined,
          targetUsername: lastTargetUsername,
          postId: lastPostId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const postDocResp = await interactPostCol.insertOne(postInteract);

        res.status(200).json({
          ok: true,
          data: postDocResp,
        });
        // create payment
        return;
      } catch (err: any) {
        console.error("Error:", err.message);
        res.status(500).json({
          ok: false,
          error: err.message,
        });
        return;
      }
    };

  public checkLinkInteract: RequestHandler<Partial<IUserInteractPost>> =
    async function (req, res) {
      const { authorUsername, targetUsername, limit = 200 } = req.body;

      if (!authorUsername || !targetUsername) {
        // logger.error("Missing input!");
        res.status(400).json({ ok: false, message: "Missing input!" });
        return;
      }

      const lastAuthorUsername = authorUsername.toLowerCase().trim();
      const lastTargetUsername = targetUsername.toLowerCase().trim();
      // console.log(lastAuthorUsername);

      try {
        const interactPostCol =
          getCollection<IUserInteractPost>("interactPosts");
        const postDocs = await interactPostCol
          .find({
            authorUsername: lastAuthorUsername,
            targetUsername: lastTargetUsername,
          })
          .sort({ createdAt: -1 })
          .limit(limit)
          .toArray();

        if (postDocs) {
          // return success
          res.status(200).json({
            ok: true,
            data: postDocs,
          });
          return;
        }

        res.status(200).json({
          ok: true,
          data: null,
        });
        return;
      } catch (err: any) {
        console.error("Error:", err.message);
        res.status(500).json({
          ok: false,
          error: err?.message || "Terminal server!",
        });
        return;
      }
    };

  // Hàm 1: Lưu tên ảnh vào DB với memberId, nameImage (không cho trùng)
  public saveImageName: RequestHandler = async function (req, res) {
    const { apiKey: memberId, nameImage } = req.body;
    // Hỗ trợ truyền vào là 1 tên hoặc chuỗi nhiều tên cách nhau bởi |
    let nameList: string[] = [];
    if (Array.isArray(nameImage)) {
      nameList = nameImage;
    } else if (typeof nameImage === "string") {
      nameList = nameImage
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (!memberId || nameList.length === 0) {
      res
        .status(400)
        .json({ ok: false, message: "Missing memberId or nameImage" });
      return;
    }
    try {
      const imageNamesCol = getCollection<{
        memberId: string;
        nameImage: string;
        createdAt: Date;
      }>("imageNames");
      const inserted: string[] = [];
      const duplicated: string[] = [];
      for (const name of nameList) {
        const existed = await imageNamesCol.findOne({
          memberId,
          nameImage: name,
        });
        if (existed) {
          duplicated.push(name);
          continue;
        }
        await imageNamesCol.insertOne({
          memberId,
          nameImage: name,
          createdAt: new Date(),
        });
        inserted.push(name);
      }
      res.status(200).json({ ok: true, data: { inserted, duplicated } });
    } catch (err: any) {
      res.status(500).json({ ok: false, message: err?.message });
    }
  };

  // Hàm 2: Kiểm tra mảng tên, trả về tên chưa dùng hoặc báo lỗi nếu đã dùng hết
  public getAvailableImageName: RequestHandler = async function (req, res) {
    const { apiKey: memberId, nameImages } = req.body;
    // Hỗ trợ truyền vào là mảng hoặc string cách nhau bằng |
    let nameList: string[] = [];
    if (Array.isArray(nameImages)) {
      nameList = nameImages;
    } else if (typeof nameImages === "string") {
      nameList = nameImages
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (!memberId || nameList.length === 0) {
      res
        .status(400)
        .json({ ok: false, message: "Missing memberId or nameImages" });
      return;
    }
    try {
      const imageNamesCol = getCollection<{
        memberId: string;
        nameImage: string;
        createdAt: Date;
      }>("imageNames");
      // Lấy tất cả tên đã dùng của member
      const usedDocs = await imageNamesCol.find({ memberId }).toArray();
      const usedNames = usedDocs.map((doc) => doc.nameImage);
      // Tìm tên chưa dùng (random)
      const unusedNames = nameList.filter(
        (name: string) => !usedNames.includes(name)
      );
      let availableName: string | undefined = undefined;
      if (unusedNames.length > 0) {
        // Random 1 tên chưa dùng
        availableName =
          unusedNames[Math.floor(Math.random() * unusedNames.length)];
      }
      if (availableName) {
        res.status(200).json({ ok: true, nameImage: availableName });
      } else {
        res.status(400).json({
          ok: false,
          message: "All names have been used.",
          data: null,
        });
      }
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  };
}

interface ICreatePostImg extends IPostReg {
  insertedId: ObjectId;
}

async function createPost(
  { userMessage, insertedId, folderName }: ICreatePostImg,
  apikey: string
) {
  const n8nHelper = new N8nHelper();
  const postsCol = getCollection<IPost>("posts");

  try {
    const renderResp = await n8nHelper.startRepostImage(
      {
        userMessage,
        folderName,
      },
      apikey
    );

    let updateFields: Partial<IPost>;

    if (renderResp?.ok == true) {
      updateFields = {
        status: "success",
        localPath: "",
        content: renderResp.data.post,
        imageUrl: "",
        updatedAt: new Date(),
      };
    } else {
      updateFields = {
        status: "error",
        imageUrl: null,
        updatedAt: new Date(),
      };
      logger.error(`Post ${insertedId} → error`);
    }

    await postsCol.updateOne({ _id: insertedId }, { $set: updateFields });
  } catch (err: any) {
    console.log("Error create post: ", err);
    await postsCol.updateOne(
      { _id: insertedId },
      {
        $set: {
          status: "error",
          message: err?.message || "",
          updatedAt: new Date(),
        },
      }
    );

    logger.error(`Post ${insertedId} → error: ${err.message}`);
  }
}

export default XHandler;
