import { Application } from "express-serve-static-core";
import drawerRouter from "../route";

async function setupRouter(app: Application) {
  app.use(drawerRouter);
}

export default setupRouter;
