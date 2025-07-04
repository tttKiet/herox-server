import { RequestHandler } from "express";
import { logger } from "../../../utils/logger";
import { isRootAdmin } from "../../../utils/functions";
import { IAdmin } from "../../../utils/interfaces";
import { getCollection } from "../../../utils/mongoDb";
import { ObjectId } from "mongodb";
import PromptService from "../../../class/PromptService";

const promptService = new PromptService();

class ManagerHandler {
  constructor() {}

  public rootAdminMdw: RequestHandler<{}, any, any> = async function (
    req,
    res,
    next
  ) {
    const { apiKey } = req.body;
    // console.log("Root, apiKey: ", apiKey);

    try {
      if (apiKey != "buikiet") {
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

  public createOrUpdatePrompt: RequestHandler<{}, any, any> = async function (
    req,
    res,
    next
  ) {
    const { apiKey, _id, context, type, status, description } = req.body;

    if (!apiKey) {
      res.status(400).json({ ok: false, message: "Missing apiKey!" });
      return;
    }

    const memberId = apiKey;

    try {
      // Validate dữ liệu prompt
      if (_id) {
        if (!ObjectId.isValid(_id)) {
          res.status(400).json({ ok: false, message: "Invalid _id format!" });
          return;
        }
      } else {
        if (!context || !type || !status) {
          res.status(400).json({
            ok: false,
            message: "Missing required fields for creation!",
          });
          return;
        }
      }

      // Gọi class Prompt
      const result = await promptService.createOrUpdatePrompt({
        _id: _id ? new ObjectId(_id) : undefined,
        memberId,
        context,
        type,
        status,
        description,
      });

      res.status(200).json({
        ok: true,
        message: "Prompt saved successfully!",
        data: result,
      });

      return;
    } catch (error: any) {
      console.error("Error:", error?.message);
      res.status(400).json({ ok: false, message: error?.message });
      return;
    }
  };

  public getPrompt: RequestHandler<{}, any, any> = async function (
    req,
    res,
    next
  ) {
    const { _id, memberId, type, status } = req.body;

    try {
      // Build filter
      const filter: {
        _id?: string;
        memberId?: string;
        type?: "PROMPT_CMT" | "PROMPT_POST";
        status?: "production" | "test";
      } = {};

      if (_id && ObjectId.isValid(_id)) filter._id = _id;
      if (memberId && ObjectId.isValid(memberId)) filter.memberId = memberId;
      if (type) filter.type = type;
      if (status) filter.status = status;

      const result = await promptService.getPrompt(filter);

      res.status(200).json({
        ok: true,
        message: "Fetched prompts successfully!",
        data: result,
      });
    } catch (error: any) {
      console.error("Error:", error?.message);
      res.status(400).json({ ok: false, message: error?.message });
    }
  };

  public deletePrompt: RequestHandler<{}, any, any> = async function (
    req,
    res,
    next
  ) {
    const { apiKey, _id } = req.body;

    if (!apiKey || !_id) {
      res.status(400).json({ ok: false, message: "Missing apiKey or _id!" });
      return;
    }

    try {
      const result = await promptService.deletePrompt(_id);

      res.status(200).json({
        ok: true,
        message: "Prompt deleted successfully",
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({ ok: false, message: error?.message });
    }
  };

  public pickPrompt: RequestHandler<{}, any, any> = async function (
    req,
    res,
    next
  ) {
    const { type } = req.body;

    if (!type) {
      res.status(400).json({ ok: false, message: "Missing prompt type!" });
      return;
    } else if (type != "PROMPT_CMT" && type != "PROMPT_POST") {
      res.status(400).json({ ok: false, message: "Type prompt invalid!" });
      return;
    }

    try {
      const result = await promptService.pickPrompt({ type });

      res.status(200).json({
        ok: true,
        message: "Random prompt fetched successfully",
        data: result,
      });
      return;
    } catch (error: any) {
      res.status(400).json({ ok: false, message: error?.message });
      return;
    }
  };
}

export default ManagerHandler;
