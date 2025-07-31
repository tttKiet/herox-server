import { RequestHandler } from "express";
import SettingsManager from "../../../class/SettingsManager";
import { logger } from "../../../utils/logger";
import { IInteractXSettings } from "../../../utils/interfaces";

const settingsManager = new SettingsManager();
class SettingsHandler {
  constructor() {}

  /**
   * Lấy cài đặt hiện tại
   */
  public getSettings: RequestHandler<{}, any, any> = async function (
    req,
    res,
    next
  ) {
    try {
      const settings = await settingsManager.getSettings();

      if (!settings) {
        res.status(404).json({
          ok: false,
          message: "Không tìm thấy cài đặt",
        });
        return;
      }

      res.status(200).json({
        ok: true,
        data: settings,
      });
    } catch (error) {
      logger.error(`Lỗi khi lấy cài đặt: ${error}`);
      res.status(500).json({
        ok: false,
        message: `Lỗi server: ${error}`,
      });
    }
  };

  /**
   * Cập nhật cài đặt hệ thống
   */
  public updateSettings: RequestHandler<{}, any, any> = async function (
    req,
    res,
    next
  ) {
    try {
      const {
        minimumLinksForTask,
        minimumLinkForAdmin,
        additionalLinks,
        selectionMethod,
        additionalLinkSource,
      } = req.body;

      // Kiểm tra các trường dữ liệu đầu vào
      const updatedFields: Partial<IInteractXSettings> = {};

      if (minimumLinksForTask !== undefined) {
        const minLinks = Number(minimumLinksForTask);
        if (isNaN(minLinks) || minLinks <= 0) {
          res.status(400).json({
            ok: false,
            message: "minimumLinksForTask phải là số dương",
          });
          return;
        }
        updatedFields.minimumLinksForTask = minLinks;
      }

      if (minimumLinkForAdmin !== undefined) {
        const minAdminLinks = Number(minimumLinkForAdmin);
        if (isNaN(minAdminLinks) || minAdminLinks < 0) {
          res.status(400).json({
            ok: false,
            message: "minimumLinkForAdmin phải là số không âm",
          });
          return;
        }
        updatedFields.minimumLinkForAdmin = minAdminLinks;
      }

      if (additionalLinks !== undefined) {
        const addLinks = Number(additionalLinks);
        if (isNaN(addLinks) || addLinks < 0) {
          res.status(400).json({
            ok: false,
            message: "additionalLinks phải là số không âm",
          });
          return;
        }
        updatedFields.additionalLinks = addLinks;
      }

      if (selectionMethod !== undefined) {
        if (
          !["newest", "oldest", "random", "least-interactions"].includes(
            selectionMethod
          )
        ) {
          res.status(400).json({
            ok: false,
            message: "selectionMethod không hợp lệ",
          });
          return;
        }
        updatedFields.selectionMethod = selectionMethod;
      }

      if (additionalLinkSource !== undefined) {
        if (!["member", "admin"].includes(additionalLinkSource)) {
          res.status(400).json({
            ok: false,
            message: "additionalLinkSource không hợp lệ",
          });
          return;
        }
        updatedFields.additionalLinkSource = additionalLinkSource;
      }

      // Nếu không có trường nào được cập nhật
      if (Object.keys(updatedFields).length === 0) {
        res.status(400).json({
          ok: false,
          message: "Không có trường nào được cập nhật",
        });
        return;
      }

      // Lấy thông tin người dùng từ request hoặc sử dụng "system" nếu không có
      const updatedBy = req.body.userId || "system";

      // Cập nhật cài đặt
      const updatedSettings = await settingsManager.updateSettings(
        updatedFields,
        updatedBy
      );

      if (!updatedSettings) {
        res.status(500).json({
          ok: false,
          message: "Không thể cập nhật cài đặt",
        });
        return;
      }

      res.status(200).json({
        ok: true,
        message: "Cập nhật cài đặt thành công",
        data: updatedSettings,
      });
    } catch (error) {
      logger.error(`Lỗi khi cập nhật cài đặt: ${error}`);
      res.status(500).json({
        ok: false,
        message: `Lỗi server: ${error}`,
      });
    }
  };
}

export default new SettingsHandler();
