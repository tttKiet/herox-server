import { RequestHandler } from "express";
import { ObjectId } from "mongodb";
import { IAdmin, IPayment } from "../../../utils/interfaces";
import { getCollection } from "../../../utils/mongoDb";
import { logger } from "../../../utils/logger";

export interface IDataResGetPaymentSuccess {
  member: IAdmin | null;
  billing: {
    count: number;
  };
}

class AdminHandler {
  constructor() {}

  public createKeyMember: RequestHandler<IAdmin> = async function (req, res) {
    const { fullName } = req.body;

    if (!fullName) {
      res.status(400).json({ ok: false, message: "Missing input parameter!" });
      return;
    }

    try {
      const repoCol = getCollection<IAdmin>("admins");
      const adminDocs = await repoCol.findOne({ fullName });

      if (adminDocs) {
        res.status(200).json({
          ok: true,
          data: adminDocs,
        });
        return;
      }

      // create doc
      const adminDoc: IAdmin = {
        permisson: "Member Admin",
        type: "member",
        fullName,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const repoResp = await repoCol.insertOne(adminDoc);

      res.status(200).json({
        ok: true,
        data: repoResp,
      });
      return;
    } catch (err: any) {
      console.error("Error:", err.message);
      res.status(500).json({ error: err.message });
      return;
    }
  };

  /**
   * Ensure the default API Key always exists with a fixed ID
   */
  async seedDefaultKey(): Promise<void> {
    const repoCol = getCollection<IAdmin>("admins");
    const FIXED_ID_STRING = "6961f65bed403fc5c7471e24";
    const FIXED_KEY = "buikiet";
    const FIXED_NAME = "Hero";

    try {
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(
        now.getMonth() + 1
      ).padStart(2, "0")}`;

      // Chuyển đổi string ID thành ObjectId
      const _id = new ObjectId(FIXED_ID_STRING);

      // Sử dụng findOneAndUpdate của MongoDB Driver
      const result = await repoCol.findOneAndUpdate(
        { _id: _id }, // Điều kiện tìm kiếm: Đúng cái ID này
        {
          // $setOnInsert: Chỉ chạy khi document chưa tồn tại (Insert mới).
          // Nếu document đã có (Update), dòng này bị bỏ qua -> Giữ nguyên data cũ (usage, stats...)
          $setOnInsert: {
            _id: _id,
            permisson: "Admin",
            fullName: FIXED_NAME,
            type: "admin",
            createdAt: now,
            updatedAt: now,
          } as any, // Cast as any nếu type IApiKeyTwitter strict quá
        },
        {
          upsert: true, // Quan trọng: Chưa có thì tạo, có rồi thì thôi
          returnDocument: "after",
        }
      );

      // Kiểm tra xem là vừa tạo mới hay đã có sẵn (dựa vào lastErrorObject hoặc value)
      // Note: MongoDB driver v4+ trả về object { value, ok, lastErrorObject } hoặc trực tiếp value tùy version.
      // Log đơn giản:
      if (result?._id) {
        // Logic check cũ
        logger.info(
          `[System] Default API Key check completed for ID: ${FIXED_ID_STRING}`
        );
      } else {
        // Driver mới trả về trực tiếp document hoặc null
        logger.info(
          `[System] Default API Key ensured: Hero - ${FIXED_ID_STRING}`
        );
      }
    } catch (error: any) {
      // Xử lý trường hợp duplicate key nếu lỡ có 1 ID khác đang giữ key "buikiet"
      if (error.code === 11000) {
        logger.warn(
          `[System] Could not seed default key. Key '${FIXED_KEY}' might already exist on another ID.`
        );
      } else {
        logger.error(`Failed to seed default API key: ${error.message}`);
      }
    }
  }

  /**
   * Get all members from admins collection
   * Used for dropdowns and filters in UI
   */
  public getAllMembers: RequestHandler = async function (req, res) {
    try {
      const adminCollection = getCollection<IAdmin>("admins");

      // Find all documents where type is "member"
      const members = await adminCollection
        .find()
        .sort({ fullName: 1 }) // Sort alphabetically by name
        .toArray();

      res.status(200).json({
        ok: true,
        data: members,
      });
    } catch (err: any) {
      console.error("Error fetching members:", err.message);
      res.status(500).json({
        ok: false,
        message: "Failed to fetch members",
        error: err.message,
      });
    }
  };

  public getPayment: RequestHandler<IAdmin> = async function (req, res) {
    const { apiKey } = req.body;

    try {
      const repoPaymentCol = getCollection<IPayment>("payments");
      const repoAdminCol = getCollection<IAdmin>("admins");

      // infor admin
      const adminDocs = await repoAdminCol.findOne({
        _id: new ObjectId(apiKey),
      });

      // infor usage
      const countDocs = await repoPaymentCol.countDocuments({
        memberId: apiKey,
      });

      const dataResp: IDataResGetPaymentSuccess = {
        member: adminDocs,
        billing: {
          count: countDocs,
        },
      };

      res.status(200).json({
        ok: true,
        data: dataResp,
      });
      return;
    } catch (err: any) {
      console.error("Error:", err.message);
      res.status(500).json({ error: err.message });
      return;
    }
  };
}

export default AdminHandler;
