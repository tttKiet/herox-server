import { Router } from "express";
import XHandler from "../app/handler/x";
import AdminHandler from "../app/handler/admin";
import ManagerHandler from "../app/handler/manager";

const xHandler = new XHandler();
const adminHandler = new AdminHandler();
const managerMiddleWare = new ManagerHandler();

const drawerRouter = Router();

drawerRouter.get("/api/v1/scrape/:username", xHandler.scrape);
drawerRouter.get("/api/v1/reup/post/:id", xHandler.getPostById);
drawerRouter.post(
  "/api/v1/reup/post-image",
  managerMiddleWare.memberMdw,
  xHandler.reupPostImage
);

// check post interact
drawerRouter.post("/api/v1/x/save-interact-post", xHandler.saveLinkInteract);
drawerRouter.post("/api/v1/x/check-interact-post", xHandler.checkLinkInteract);

// admin
drawerRouter.post(
  "/api/v1/admin",
  managerMiddleWare.rootAdminMdw,
  adminHandler.createKeyMember
);

drawerRouter.post(
  "/api/v1/member/payment",
  managerMiddleWare.memberMdw,
  adminHandler.getPayment
);

export default drawerRouter;
