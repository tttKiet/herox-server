import { Router } from "express";
import XHandler from "../app/handler/x";
import AdminHandler from "../app/handler/admin";
import ManagerHandler from "../app/handler/manager";

const xHandler = new XHandler();
const adminHandler = new AdminHandler();
const managerMiddleWare = new ManagerHandler();

const drawerRouter = Router();

drawerRouter.get("/scrape/:username", xHandler.scrape);
drawerRouter.get("/reup/post/:id", xHandler.getPostById);
drawerRouter.post(
  "/reup/post-image",
  managerMiddleWare.memberMdw,
  xHandler.reupPostImage
);

// check post interact
drawerRouter.post("/x/save-interact-post", xHandler.saveLinkInteract);
drawerRouter.post("/x/check-interact-post", xHandler.checkLinkInteract);

// admin
drawerRouter.post(
  "/admin",
  managerMiddleWare.rootAdminMdw,
  adminHandler.createKeyMember
);

export default drawerRouter;
