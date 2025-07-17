import { RequestHandler } from "express";
import { logger } from "../../../utils/logger";
import { isRootAdmin } from "../../../utils/functions";
import { IAdmin, ITopic, IProject } from "../../../utils/interfaces";
import { getCollection } from "../../../utils/mongoDb";
import { ObjectId } from "mongodb";
import PromptService from "../../../class/PromptService";
import N8nHelper from "../../../class/N8nHelper";

const promptService = new PromptService();
const n8nHelper = new N8nHelper();

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
    const apiKey = req.body?.apiKey;

    if (!apiKey) {
      res.status(400).json({ ok: false, message: "Missing apiKey!" });
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
    const { apiKey, _id, context, type, status, description, name } = req.body;

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
        if (!context || !type || !status || !name) {
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
        name,
        memberId: _id ? undefined : memberId,
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
    // Lấy param từ req.query (luôn là string | string[] | undefined)
    const { _id, memberId, type, status } = req.query;

    try {
      // Build filter
      const filter: {
        _id?: string;
        memberId?: string;
        type?: "PROMPT_CMT" | "PROMPT_POST" | "PROMPT_IMG";
        status?: "production" | "test";
      } = {};

      if (typeof _id === "string" && ObjectId.isValid(_id)) filter._id = _id;
      if (typeof memberId === "string" && ObjectId.isValid(memberId))
        filter.memberId = memberId;
      if (typeof type === "string")
        filter.type = type as "PROMPT_CMT" | "PROMPT_POST" | "PROMPT_IMG";
      if (typeof status === "string")
        filter.status = status as "production" | "test";

      const promptDocs = await promptService.getPrompt(filter);

      // Lấy thông tin member cho từng prompt
      const adminCol = getCollection<IAdmin>("admins");
      const memberIds = Array.from(
        new Set(promptDocs.map((p: any) => p.memberId).filter(Boolean))
      );
      const adminDocsArr = await adminCol
        .find({
          _id: { $in: memberIds.map((id) => new ObjectId(id)) },
        })
        .toArray();
      const adminMap = Object.fromEntries(
        adminDocsArr.map((a) => [a._id.toString(), a])
      );

      const promptWithMember = promptDocs.map((p: any) => ({
        ...p,
        member: adminMap[p.memberId] || null,
      }));

      res.status(200).json({
        ok: true,
        message: "Fetched prompts successfully!",
        data: promptWithMember,
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
    const { type, apiKey } = req.body;

    if (!type) {
      res.status(400).json({ ok: false, message: "Missing prompt type!" });
      return;
    } else if (type != "PROMPT_CMT" && type != "PROMPT_POST") {
      res.status(400).json({ ok: false, message: "Type prompt invalid!" });
      return;
    }

    try {
      const result = await promptService.pickPrompt({ type, memberId: apiKey });

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

  // Topic Project Management
  public createTopics: RequestHandler<{}, any, any> = async function (
    req,
    res,
    next
  ) {
    const { apiKey, topics } = req.body;

    if (!apiKey) {
      res.status(400).json({ ok: false, message: "Missing apiKey!" });
      return;
    }

    if (!topics || !Array.isArray(topics) || topics.length === 0) {
      res.status(400).json({
        ok: false,
        message: "Topics must be a non-empty array!",
      });
      return;
    }

    try {
      const topicCollection = getCollection<ITopic>("topics");
      const now = new Date();

      // Validate topic data
      for (const topic of topics) {
        if (!topic.topicName || !topic.projectName) {
          res.status(400).json({
            ok: false,
            message: "Each topic must have topicName and projectName!",
          });
          return;
        }
      }

      // Create topic documents
      const topicDocuments = topics.map((topic) => ({
        topicName: topic.topicName,
        projectName: topic.projectName,
        createdAt: now,
        updatedAt: now,
      }));

      // Insert all topics
      const result = await topicCollection.insertMany(topicDocuments);

      res.status(201).json({
        ok: true,
        message: `${result.insertedCount} topics created successfully!`,
        data: {
          insertedCount: result.insertedCount,
          insertedIds: result.insertedIds,
        },
      });

      return;
    } catch (error: any) {
      logger.error("Error creating topics:", error?.message);
      res.status(500).json({
        ok: false,
        message: `Failed to create topics: ${error?.message}`,
      });
      return;
    }
  };

  public getTopics: RequestHandler<{}, any, any> = async function (
    req,
    res,
    next
  ) {
    const { topicName, projectName, page = "1", limit = "10" } = req.query;

    try {
      // Build filter
      const filter: {
        topicName?: { $regex: string; $options: string };
        projectName?: { $regex: string; $options: string };
      } = {};

      if (typeof topicName === "string" && topicName.trim()) {
        filter.topicName = { $regex: topicName, $options: "i" };
      }

      if (typeof projectName === "string" && projectName.trim()) {
        filter.projectName = { $regex: projectName, $options: "i" };
      }

      // Parse page & limit
      const pageNum = Math.max(parseInt(page as string, 10) || 1, 1);
      const limitNum = Math.max(parseInt(limit as string, 10) || 10, 1);
      const skipNum = (pageNum - 1) * limitNum;

      const topicCollection = getCollection<ITopic>("topics");
      const [topics, total] = await Promise.all([
        topicCollection
          .find(filter)
          .sort({ createdAt: -1 })
          .skip(skipNum)
          .limit(limitNum)
          .toArray(),
        topicCollection.countDocuments(filter),
      ]);

      res.status(200).json({
        ok: true,
        message: "Topics fetched successfully!",
        data: topics,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });

      return;
    } catch (error: any) {
      logger.error("Error fetching topics:", error?.message);
      res.status(500).json({
        ok: false,
        message: `Failed to fetch topics: ${error?.message}`,
      });
      return;
    }
  };

  public deleteTopics: RequestHandler<{}, any, any> = async function (
    req,
    res,
    next
  ) {
    const { apiKey, topicIds } = req.body;

    if (!apiKey) {
      res.status(400).json({ ok: false, message: "Missing apiKey!" });
      return;
    }

    if (!topicIds || !Array.isArray(topicIds) || topicIds.length === 0) {
      res.status(400).json({
        ok: false,
        message: "topicIds must be a non-empty array!",
      });
      return;
    }

    try {
      // Validate IDs
      const validObjectIds: ObjectId[] = [];
      for (const id of topicIds) {
        if (ObjectId.isValid(id)) {
          validObjectIds.push(new ObjectId(id));
        } else {
          res.status(400).json({
            ok: false,
            message: `Invalid topicId format: ${id}`,
          });
          return;
        }
      }

      const topicCollection = getCollection<ITopic>("topics");

      // Delete topics
      const result = await topicCollection.deleteMany({
        _id: { $in: validObjectIds },
      });

      if (result.deletedCount === 0) {
        res.status(404).json({
          ok: false,
          message: "No topics found with the provided IDs.",
        });
        return;
      }

      res.status(200).json({
        ok: true,
        message: `${result.deletedCount} topics deleted successfully!`,
        data: {
          deletedCount: result.deletedCount,
        },
      });

      return;
    } catch (error: any) {
      logger.error("Error deleting topics:", error?.message);
      res.status(500).json({
        ok: false,
        message: `Failed to delete topics: ${error?.message}`,
      });
      return;
    }
  };

  public generateTopics: RequestHandler<{}, any, any> = async function (
    req,
    res,
    next
  ) {
    const { apiKey, projectName, quantities } = req.body;

    if (!apiKey) {
      res.status(400).json({ ok: false, message: "Missing apiKey!" });
      return;
    }

    if (!projectName || typeof projectName !== "string") {
      res.status(400).json({
        ok: false,
        message: "projectName is required and must be a string!",
      });
      return;
    }

    if (quantities < 1 || quantities > 101) {
      res.status(400).json({
        ok: false,
        message:
          "quantities is required and must be a number between 1 and 100!",
      });
      return;
    }

    try {
      // Lấy danh sách các topics hiện có cho project này
      const topicCollection = getCollection<ITopic>("topics");
      const existingTopicsArray = await topicCollection
        .find({ projectName: { $regex: projectName, $options: "i" } })
        .project({ topicName: 1, _id: 0 })
        .toArray();
      const existingTopics = existingTopicsArray.map((doc) => doc.topicName);

      // Gọi N8nHelper để tạo topics mới
      const n8nResponse = await n8nHelper.generatorTopic(
        {
          projectName,
          quantities,
          existingTopics: existingTopics as string[],
        },
        apiKey
      );

      if (!n8nResponse) {
        res.status(500).json({
          ok: false,
          message: "Failed to generate topics with N8n service",
        });
        return;
      }

      // Nếu AI tạo topics thành công, lưu vào database
      if (
        n8nResponse.ok &&
        Array.isArray(n8nResponse.data) &&
        n8nResponse.data.length > 0
      ) {
        const now = new Date();
        const topicDocuments = n8nResponse.data.map((topicName) => ({
          topicName,
          projectName,
          createdAt: now,
          updatedAt: now,
        }));

        // Insert all topics
        const result = await topicCollection.insertMany(topicDocuments);

        res.status(201).json({
          ok: true,
          message: `${result.insertedCount} AI-generated topics created successfully!`,
          data: {
            generatedTopics: n8nResponse.data,
            insertedCount: result.insertedCount,
            insertedIds: result.insertedIds,
          },
        });
        return;
      } else {
        res.status(500).json({
          ok: false,
          message: "AI service returned no topics or invalid response",
          data: n8nResponse,
        });
        return;
      }
    } catch (error: any) {
      logger.error("Error generating topics:", error?.message);
      res.status(500).json({
        ok: false,
        message: `Failed to generate topics: ${error?.message}`,
      });
      return;
    }
  };

  // Project Management
  public createProject: RequestHandler<{}, any, any> = async function (
    req,
    res,
    next
  ) {
    const { apiKey, name, description } = req.body;

    if (!apiKey) {
      res.status(400).json({ ok: false, message: "Missing apiKey!" });
      return;
    }

    if (!name || typeof name !== "string") {
      res.status(400).json({
        ok: false,
        message: "Project name is required and must be a string!",
      });
      return;
    }

    try {
      const projectCollection = getCollection<IProject>("projects");
      const now = new Date();

      // Kiểm tra xem dự án đã tồn tại chưa
      const existingProject = await projectCollection.findOne({
        name: { $regex: `^${name}$`, $options: "i" }, // Case insensitive exact match
      });

      if (existingProject) {
        res.status(400).json({
          ok: false,
          message: `Project with name "${name}" already exists!`,
        });
        return;
      }

      // Tạo dự án mới
      const projectDocument = {
        name,
        description,
        createdAt: now,
        updatedAt: now,
      };

      const result = await projectCollection.insertOne(projectDocument);

      res.status(201).json({
        ok: true,
        message: "Project created successfully!",
        data: {
          ...projectDocument,
          _id: result.insertedId,
        },
      });
      return;
    } catch (error: any) {
      logger.error("Error creating project:", error?.message);
      res.status(500).json({
        ok: false,
        message: `Failed to create project: ${error?.message}`,
      });
      return;
    }
  };

  public getProjects: RequestHandler<{}, any, any> = async function (
    req,
    res,
    next
  ) {
    const { name } = req.query;

    try {
      // Build filter
      const filter: {
        name?: { $regex: string; $options: string };
      } = {};

      if (typeof name === "string" && name.trim()) {
        filter.name = { $regex: name, $options: "i" };
      }

      const projectCollection = getCollection<IProject>("projects");
      const projects = await projectCollection
        .find(filter)
        .sort({ createdAt: -1 })
        .toArray();

      res.status(200).json({
        ok: true,
        message: "Projects fetched successfully!",
        data: projects,
      });
      return;
    } catch (error: any) {
      logger.error("Error fetching projects:", error?.message);
      res.status(500).json({
        ok: false,
        message: `Failed to fetch projects: ${error?.message}`,
      });
      return;
    }
  };

  public deleteProjects: RequestHandler<{}, any, any> = async function (
    req,
    res,
    next
  ) {
    const { apiKey, projectIds } = req.body;

    if (!apiKey) {
      res.status(400).json({ ok: false, message: "Missing apiKey!" });
      return;
    }

    if (!projectIds || !Array.isArray(projectIds) || projectIds.length === 0) {
      res.status(400).json({
        ok: false,
        message: "projectIds must be a non-empty array!",
      });
      return;
    }

    try {
      // Validate IDs
      const validObjectIds: ObjectId[] = [];
      for (const id of projectIds) {
        if (ObjectId.isValid(id)) {
          validObjectIds.push(new ObjectId(id));
        } else {
          res.status(400).json({
            ok: false,
            message: `Invalid projectId format: ${id}`,
          });
          return;
        }
      }

      const projectCollection = getCollection<IProject>("projects");
      const topicCollection = getCollection<ITopic>("topics");

      // Fetch projects before deletion to get their names
      const projectsToDelete = await projectCollection
        .find({ _id: { $in: validObjectIds } })
        .toArray();

      if (projectsToDelete.length === 0) {
        res.status(404).json({
          ok: false,
          message: "No projects found with the provided IDs.",
        });
        return;
      }

      // Get project names for topic deletion
      const projectNames = projectsToDelete.map((project) => project.name);

      // Delete projects
      const deleteResult = await projectCollection.deleteMany({
        _id: { $in: validObjectIds },
      });

      // Delete all topics related to these projects
      const topicResult = await topicCollection.deleteMany({
        projectName: { $in: projectNames },
      });

      res.status(200).json({
        ok: true,
        message: `${deleteResult.deletedCount} projects deleted successfully along with ${topicResult.deletedCount} related topics!`,
        data: {
          deletedCount: deleteResult.deletedCount,
          deletedTopicsCount: topicResult.deletedCount,
        },
      });
      return;
    } catch (error: any) {
      logger.error("Error deleting projects:", error?.message);
      res.status(500).json({
        ok: false,
        message: `Failed to delete projects: ${error?.message}`,
      });
      return;
    }
  };

  // Keep the old method for backward compatibility
  public deleteProject: RequestHandler<{}, any, any> = async function (
    req,
    res,
    next
  ) {
    const { apiKey, projectId } = req.body;

    if (!apiKey) {
      res.status(400).json({ ok: false, message: "Missing apiKey!" });
      return;
    }

    if (!projectId) {
      res.status(400).json({ ok: false, message: "Missing projectId!" });
      return;
    }

    // Convert single projectId to array and use the new method
    req.body.projectIds = [projectId];
    delete req.body.projectId;

    return await new ManagerHandler().deleteProjects(req, res, next);
  };
}

export default ManagerHandler;
