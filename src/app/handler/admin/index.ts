import { RequestHandler } from "express";
import { ObjectId } from "mongodb";
import { IAdmin, IPayment } from "../../../utils/interfaces";
import { getCollection } from "../../../utils/mongoDb";

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
