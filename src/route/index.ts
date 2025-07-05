import { Router } from "express";
import XHandler from "../app/handler/x";
import AdminHandler from "../app/handler/admin";
import ManagerHandler from "../app/handler/manager";
import AiHandler from "../app/handler/ai";
import AuthHandler from "../app/handler/auth/auth.index";

const xHandler = new XHandler();
const aiHandler = new AiHandler();
const adminHandler = new AdminHandler();
const managerHandler = new ManagerHandler();
const authHandler = new AuthHandler();

const mainRouter = Router();

// ai
mainRouter.post("/api/v1/ai/chat", aiHandler.chatResp);

// drawer
mainRouter.get("/api/v1/scrape/:username", xHandler.scrape);
mainRouter.get("/api/v1/reup/post/:id", xHandler.getPostById);
mainRouter.post(
  "/api/v1/reup/post-image",
  managerHandler.memberMdw,
  xHandler.reupPostImage
);

// check post interact
mainRouter.post("/api/v1/x/save-interact-post", xHandler.saveLinkInteract);
mainRouter.post("/api/v1/x/check-interact-post", xHandler.checkLinkInteract);

// admin
mainRouter.post(
  "/api/v1/admin",
  managerHandler.rootAdminMdw,
  adminHandler.createKeyMember
);

mainRouter.post(
  "/api/v1/member/payment",
  managerHandler.memberMdw,
  adminHandler.getPayment
);

// prompt

mainRouter.post(
  "/api/v1/prompt/pick-prompt",
  managerHandler.memberMdw,
  managerHandler.pickPrompt
);

mainRouter.post(
  "/api/v1/prompt",
  managerHandler.memberMdw,
  managerHandler.createOrUpdatePrompt
);

mainRouter.get(
  "/api/v1/prompt",
  managerHandler.memberMdw,
  managerHandler.getPrompt
);

mainRouter.delete(
  "/api/v1/prompt",
  managerHandler.memberMdw,
  managerHandler.deletePrompt
);

// auth
mainRouter.post("/api/v1/auth/login", authHandler.login);

export default mainRouter;
