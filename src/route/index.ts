import { Router } from "express";
import XHandler from "../app/handler/x";

const xHandler = new XHandler();

const drawerRouter = Router();

drawerRouter.get("/scrape/:username", xHandler.scrape);
drawerRouter.get("/reup/post/:id", xHandler.getPostById);
drawerRouter.post("/reup/post-image", xHandler.reupPostImage);

// check post interact
drawerRouter.post("/x/save-interact-post", xHandler.saveLinkInteract);
drawerRouter.post("/x/check-interact-post", xHandler.checkLinkInteract);

export default drawerRouter;
