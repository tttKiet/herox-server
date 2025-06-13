import { RequestHandler } from "express";
import { IAdmin, IPayment } from "../../../utils/interfaces";
import { logger } from "../../../utils/logger";
import { getCollection } from "../../../utils/mongoDb";
import { ObjectId } from "mongodb";

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
    logger.info("FullName: " + fullName);

    if (!fullName) {
      logger.error("Missing input parameter!");
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
