import { RequestHandler } from "express";
import { ObjectId } from "mongodb";
import { IAdmin } from "../../../utils/interfaces";
import { getCollection } from "../../../utils/mongoDb";

class AuthHandler {
  constructor() {}

  public login: RequestHandler<{}, any, any> = async function (req, res, next) {
    const apiKey = req.body?.apiKey;
    if (!apiKey) {
      res.status(400).json({ ok: false, message: "Missing apiKey!" });
      return;
    }

    // Kiểm tra định dạng ObjectId hợp lệ
    if (!ObjectId.isValid(apiKey)) {
      res.status(401).json({ ok: false, message: "Invalid apiKey!" });
      return;
    }

    try {
      const memberCol = getCollection<IAdmin>("admins");
      const member = await memberCol.findOne({ _id: new ObjectId(apiKey) });
      if (!member) {
        res.status(401).json({ ok: false, message: "Invalid apiKey!" });
        return;
      }
      res.status(200).json({ ok: true, data: member });
    } catch (err: any) {
      res.status(500).json({ ok: false, message: err.message });
    }
  };
}

export default AuthHandler;
