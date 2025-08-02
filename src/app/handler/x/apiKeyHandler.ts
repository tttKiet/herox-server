import { RequestHandler } from "express";
import { ApiKeyTwitterManager } from "../../../class/ApiKeyTwitterManager";
import { IApiKeyTwitter } from "../../../utils/interfaces";
import { logger } from "../../../utils/logger";

class ApiKeyHandler {
  constructor() {}

  /**
   * Create API keys from text input
   * Format:
   * name1 apikey1
   * name2 apikey2|
   * or just
   * apikey1
   * apikey2
   */
  public createApiKey: RequestHandler = async function (req, res) {
    try {
      const { apiKeys } = req.body;

      if (!apiKeys) {
        res.status(400).json({
          success: false,
          message: "API keys are required",
        });
        return;
      }

      const manager = new ApiKeyTwitterManager();
      const results: {
        successful: Array<{ id: any; name: string }>;
        failed: Array<{ line: string; error: string }>;
      } = {
        successful: [],
        failed: [],
      };

      // Xử lý dựa vào kiểu của apiKeys
      if (typeof apiKeys === "string") {
        // Trường hợp apiKeys là chuỗi văn bản
        const lines = apiKeys.split(/\r?\n/).filter((line) => line.trim());

        for (const line of lines) {
          try {
            let apiKey: string;
            let name: string;

            if (line.includes(" ")) {
              // Format: name apikey
              const parts = line.trim().split(/\s+/);
              name = parts[0];
              apiKey = parts.slice(1).join(" ").replace(/\|$/, ""); // Remove trailing pipe if exists
            } else {
              // Format: just apikey
              apiKey = line.trim().replace(/\|$/, ""); // Remove trailing pipe if exists
              name = `API Key ${new Date().toISOString().slice(0, 10)}`;
            }

            const newKey = await manager.addKey({
              apiKey,
              name,
              status: "active",
              usageThisMonth: 0,
              totalUsageCount: 0,
              monthlyUsage: {},
            });

            results.successful.push({
              id: newKey._id,
              name: newKey.name,
            });
          } catch (error: any) {
            results.failed.push({
              line,
              error: error.message,
            });
          }
        }
      } else if (Array.isArray(apiKeys)) {
        // Trường hợp apiKeys là mảng objects
        for (const item of apiKeys) {
          try {
            const {
              apiKey,
              name = `API Key ${new Date().toISOString().slice(0, 10)}`,
            } = item;

            if (!apiKey) {
              results.failed.push({
                line: JSON.stringify(item),
                error: "API key is required",
              });
              continue;
            }

            const newKey = await manager.addKey({
              apiKey,
              name,
              status: "active",
              usageThisMonth: 0,
              totalUsageCount: 0,
              monthlyUsage: {},
            });

            results.successful.push({
              id: newKey._id,
              name: newKey.name,
            });
          } catch (error: any) {
            results.failed.push({
              line: JSON.stringify(item),
              error: error.message,
            });
          }
        }
      } else {
        // Trường hợp không phải string hoặc mảng
        res.status(400).json({
          ok: false,
          message: "API keys must be a string or array of objects",
        });
        return;
      }

      res.status(200).json({
        ok: true,
        data: results,
        message: `Successfully added ${results.successful.length} API keys. Failed to add ${results.failed.length} keys.`,
      });
      return;
    } catch (error: any) {
      logger.error(`Error creating API keys: ${error.message}`);
      res.status(500).json({
        ok: false,
        message: `Error creating API keys: ${error.message}`,
      });
      return;
    }
  };

  /**
   * Get API keys with pagination and search
   */
  public getApiKeys: RequestHandler = async function (req, res) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = (req.query.search as string) || "";
      const status = (req.query.status as string) || "";

      const skip = (page - 1) * limit;
      const manager = new ApiKeyTwitterManager();

      // Prepare filter
      const filter: Partial<IApiKeyTwitter> = {};

      if (status) {
        filter.status = status as IApiKeyTwitter["status"];
      }

      // Get all keys matching filter
      let keys = await manager.getAllKeys(filter);

      // Apply search manually
      if (search) {
        const searchLower = search.toLowerCase();
        keys = keys.filter(
          (key) =>
            key.name.toLowerCase().includes(searchLower) ||
            key.description?.toLowerCase().includes(searchLower) ||
            key.apiKey.toLowerCase().includes(searchLower)
        );
      }

      // Get total count for pagination
      const total = keys.length;

      // Apply pagination manually
      const paginatedKeys = keys.slice(skip, skip + limit);

      // Mask API keys for security
      const maskedKeys = paginatedKeys.map((key) => ({
        ...key,
        apiKey: `${key.apiKey.substring(0, 5)}...${key.apiKey.substring(
          key.apiKey.length - 5
        )}`,
      }));

      res.status(200).json({
        ok: true,
        data: {
          keys: maskedKeys,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
      return;
    } catch (error: any) {
      logger.error(`Error getting API keys: ${error.message}`);
      res.status(500).json({
        ok: false,
        message: `Error getting API keys: ${error.message}`,
      });
      return;
    }
  };

  /**
   * Delete API keys by IDs
   */
  public deleteApiKey: RequestHandler = async function (req, res) {
    try {
      const { ids } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({
          ok: false,
          message: "API key IDs are required",
        });
        return;
      }

      const manager = new ApiKeyTwitterManager();
      const results: {
        deleted: string[];
        failed: Array<{ id: string; error: string }>;
      } = {
        deleted: [],
        failed: [],
      };

      for (const id of ids) {
        try {
          const deleted = await manager.deleteKey(id);
          if (deleted) {
            results.deleted.push(id);
          } else {
            results.failed.push({
              id,
              error: "API key not found",
            });
          }
        } catch (error: any) {
          results.failed.push({
            id,
            error: error.message,
          });
        }
      }

      res.status(200).json({
        ok: true,
        data: results,
        message: `Successfully deleted ${results.deleted.length} API keys. Failed to delete ${results.failed.length} keys.`,
      });
      return;
    } catch (error: any) {
      logger.error(`Error deleting API keys: ${error.message}`);
      res.status(500).json({
        ok: false,
        message: `Error deleting API keys: ${error.message}`,
      });
      return;
    }
  };
}

export default ApiKeyHandler;
