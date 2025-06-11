import { RequestHandler } from "express";
import GpmHandler from "../../../class/GpmHandler";
import { logger } from "../../../utils/logger";
import puppeteer from "puppeteer";
import { IFunctionHandler } from "../../../utils";
import {
  IPost,
  IPostImgReg,
  IUserInteractPost,
} from "../../../utils/interfaces";
import N8nHelper from "../../../class/N8nHelper";
import { ObjectId } from "mongodb";
import { getCollection } from "../../../utils/mongoDb";
import {
  doesFolderExist,
  getRandomImageBase64,
  saveHostedImageToStore,
} from "../../../utils/store-img";
import Payment from "../../../class/Payment";

const payment = new Payment();

class XHandler {
  constructor() {}

  public scrape: RequestHandler<{ username: string }> = async function (
    req,
    res
  ) {
    const { username } = req.params;

    logger.info("Drawer " + username);

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

  public reupPostImage: RequestHandler<IPostImgReg> = async function (
    req,
    res
  ) {
    const { postContent, folderName, isCreateImg, accountVerified, apiKey } =
      req.body;

    if (
      !postContent ||
      !folderName ||
      isCreateImg == undefined ||
      accountVerified == undefined
    ) {
      logger.error(`Chưa truyền đủ 4 tham số !`);
      res.status(400).json({
        ok: false,
        message: "Chưa truyền đủ 4 tham số !!!",
      });
      return;
    }

    const isFolderExisted = await doesFolderExist(folderName);
    if (!isFolderExisted) {
      logger.error(`${folderName} is not on server !`);
      res.status(400).json({
        ok: false,
        message: "Dự án chưa được thêm trên server !!!",
      });
      return;
    }

    try {
      // Create Task and save in mongo db

      const post: IPost = {
        status: "pending",
        content: "",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const postsCol = getCollection<IPost>("posts");
      const { insertedId } = await postsCol.insertOne(post);
      logger.success(`Post -> success.`);

      res.status(200).json({
        ok: true,
        data: {
          id: insertedId,
        },
      });

      createPostImg({
        insertedId,
        postContent,
        isCreateImg,
        folderName,
        accountVerified,
      });
      payment.useCreateImg({ memberId: apiKey, postId: insertedId.toString() });
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

    logger.info("Id: " + id);

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
        logger.error("Missing input!");
        res.status(400).json({ ok: false, message: "Missing input!" });
        return;
      }
      // convert input
      const urlArray = postId.split("/");
      const lastPostId = urlArray[urlArray.length - 1];
      logger.info("Save post id: ", lastPostId);

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
      const { authorUsername, targetUsername }: Partial<IUserInteractPost> =
        req.body as Partial<IUserInteractPost>;

      if (!authorUsername || !targetUsername) {
        logger.error("Missing input!");
        res.status(400).json({ ok: false, message: "Missing input!" });
        return;
      }

      const lastAuthorUsername = authorUsername.toLowerCase().trim();
      const lastTargetUsername = targetUsername.toLowerCase().trim();
      console.log(lastAuthorUsername);

      try {
        const interactPostCol =
          getCollection<IUserInteractPost>("interactPosts");
        const postDocs = await interactPostCol
          .find({
            authorUsername: lastAuthorUsername,
            // targetUsername: lastTargetUsername,
          })
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
}

interface ICreatePostImg extends IPostImgReg {
  insertedId: ObjectId;
}

async function createPostImg({
  postContent,
  insertedId,
  isCreateImg,
  folderName,
  accountVerified,
}: ICreatePostImg) {
  const n8nHelper = new N8nHelper();
  const postsCol = getCollection<IPost>("posts");
  logger.info("Folder Name: ", folderName);

  const imgRootBase64 = await getRandomImageBase64(folderName);

  try {
    const renderResp = await n8nHelper.startRepostImage({
      postContent,
      imgRootBase64,
      isCreateImg,
      folderName,
      accountVerified,
    });

    let updateFields: Partial<IPost>;

    if (renderResp?.ok == true) {
      const pathResp = await saveHostedImageToStore(
        renderResp.data.imageUrl,
        folderName
      );

      updateFields = {
        status: "success",
        localPath: pathResp,
        content: renderResp.data.post,
        imageUrl: renderResp.data.imageUrl,
        updatedAt: new Date(),
      };

      logger.success(`Save post to pc → success`);
      logger.success(`Post ${insertedId} → success`);
    } else {
      updateFields = {
        status: "error",
        imageUrl: null,
        updatedAt: new Date(),
      };
      logger.error(`Post ${insertedId} → error`);
    }

    await postsCol.updateOne({ _id: insertedId }, { $set: updateFields });
    logger.info(`Process ${insertedId} → done`);
  } catch (err: any) {
    console.log("err: ", err);

    // 4b) Nếu lỗi, cập nhật status = error
    await postsCol.updateOne(
      { _id: insertedId },
      { $set: { status: "error", updatedAt: new Date() } }
    );

    logger.error(`Post ${insertedId} → error: ${err.message}`);
  }
}

export default XHandler;
