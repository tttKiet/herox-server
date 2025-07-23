import { Router } from "express";
import XHandler from "../app/handler/x";
import AdminHandler from "../app/handler/admin";
import ManagerHandler from "../app/handler/manager";
import AiHandler from "../app/handler/ai";
import AuthHandler from "../app/handler/auth/auth.index";
import ChatHandler from "../app/handler/ai/chats";
import InteractPostHandler from "../app/handler/x/interactPosts";

const xHandler = new XHandler();
const aiHandler = new AiHandler();
const adminHandler = new AdminHandler();
const managerHandler = new ManagerHandler();
const authHandler = new AuthHandler();
const chatHandler = new ChatHandler();
const interactPostHandler = new InteractPostHandler();

const mainRouter = Router();

// ai
mainRouter.get("/api/v1/ai/chat/:chatId", aiHandler.getChat);
mainRouter.post("/api/v1/ai/chat", aiHandler.chatResp);
mainRouter.get("/api/v1/ai/chats", chatHandler.getChats);

// drawer
mainRouter.get("/api/v1/scrape/:username", xHandler.scrape);
mainRouter.get("/api/v1/reup/post/:id", xHandler.getPostById);
mainRouter.post(
  "/api/v1/reup/post-image",
  managerHandler.memberMdw,
  xHandler.reupPost
);

// check post interact
mainRouter.post("/api/v1/x/save-interact-post", xHandler.saveLinkInteract);
mainRouter.post("/api/v1/x/check-interact-post", xHandler.checkLinkInteract);
mainRouter.post(
  "/api/v1/x/interact-posts",
  interactPostHandler.getInteractPosts
);
mainRouter.post(
  "/api/v1/x/random-non-interacted-link",
  interactPostHandler.getRandomNonInteractedLink
);

// admin
mainRouter.post(
  "/api/v1/admin",
  managerHandler.rootAdminMdw,
  adminHandler.createKeyMember
);

// Get all members for dropdowns/filters
mainRouter.get("/api/v1/admin/members", adminHandler.getAllMembers);

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

mainRouter.get("/api/v1/prompt", managerHandler.getPrompt);

mainRouter.delete(
  "/api/v1/prompt",
  managerHandler.memberMdw,
  managerHandler.deletePrompt
);

// auth
mainRouter.post("/api/v1/auth/login", authHandler.login);

// save img
mainRouter.post(
  "/api/v1/img/save-name",
  managerHandler.memberMdw,
  xHandler.saveImageName
);

mainRouter.post(
  "/api/v1/img/get-available-name-random",
  managerHandler.memberMdw,
  xHandler.getAvailableImageName
);

// Topic Project Management
mainRouter.post(
  "/api/v1/topic",
  managerHandler.memberMdw,
  managerHandler.createTopics
);

mainRouter.get("/api/v1/topic", managerHandler.getTopics);

mainRouter.delete(
  "/api/v1/topic",
  managerHandler.memberMdw,
  managerHandler.deleteTopics
);

// AI-powered Topic Generation
mainRouter.post(
  "/api/v1/topic/generator",
  managerHandler.memberMdw,
  managerHandler.generateTopics
);

// Project Management
mainRouter.post(
  "/api/v1/project",
  managerHandler.memberMdw,
  managerHandler.createProject
);

mainRouter.get("/api/v1/project", managerHandler.getProjects);

mainRouter.delete(
  "/api/v1/project",
  managerHandler.memberMdw,
  managerHandler.deleteProject
);

mainRouter.delete(
  "/api/v1/projects",
  managerHandler.memberMdw,
  managerHandler.deleteProjects
);

export default mainRouter;
