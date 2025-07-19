import { Application } from "express-serve-static-core";
import mainRouter from "../route";

async function setupRouter(app: Application) {
  app.use(mainRouter);
}

export default setupRouter;
