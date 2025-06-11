import { RequestHandler } from "express";
import { logger } from "../../../utils/logger";
import { isRootAdmin } from "../../../utils/functions";
import { IAdmin } from "../../../utils/interfaces";
import { getCollection } from "../../../utils/mongoDb";
import { ObjectId } from "mongodb";

class ManagerHandler {
  constructor() {}

  public rootAdminMdw: RequestHandler<{}, any, any> = async function (
    req,
    res,
    next
  ) {
    const { apiKey } = req.body;
    console.log("Root, apiKey: ", apiKey);

    try {
      if (apiKey != "6848f9d89c5628b0a3827784") {
        logger.error("Not admin !");
        res.status(401).json({ ok: false, message: "You aren't admin!" });
        return;
      } else next();
      return;
    } catch (err: any) {
      console.error("Error:", err.message);
      res.status(500).json({ error: err.message });
      return;
    }
  };

  public memberMdw: RequestHandler<{}, any, any> = async function (
    req,
    res,
    next
  ) {
    const { apiKey } = req.body;
    if (!apiKey) {
      res.status(400).json({ ok: false, message: "Missing input parameter!" });
      return;
    }

    try {
      const repoCol = getCollection<IAdmin>("admins");
      const adminDocs = await repoCol.findOne({ _id: new ObjectId(apiKey) });
      console.log(adminDocs);

      if (!adminDocs) {
        res.status(401).json({ ok: false, message: "Permission denied!" });
        return;
      }

      next();
    } catch (err: any) {
      console.error("Error:", err.message);
      res.status(500).json({ error: err.message });
      return;
    }
  };
}

export default ManagerHandler;
