import express from "express";
import drawerRouter from "./route";
import "dotenv/config";
import morgan from "morgan";
import setupRouter from "./configs/router";
import { setupDB } from "./utils/mongoDb";
import { logger } from "./utils/logger";
import helmet from "helmet";
import path from "path";
const PORT = process.env.POST_SERVER;
const MONGODB_URL = process.env.MONGODB_URL || "http://127.0.0.1:27017";
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || "x-n8n-kaito";

const folderPathStatic = path.resolve(__dirname, `../assets/images/store-imgs`);

async function serverRunner() {
  const app = express();
  app.use(express.json()); // parse application/json
  app.use(express.urlencoded({ extended: true })); // parse application/x-www-form-urlencoded

  // logger morgan
  morgan.token("statusColor", (req, res) => {
    const status = res.statusCode;
    const color =
      status >= 500
        ? "\x1b[31m" // red
        : status >= 400
        ? "\x1b[33m" // yellow
        : status >= 300
        ? "\x1b[36m" // cyan
        : status >= 200
        ? "\x1b[32m" // green
        : "\x1b[0m"; // reset
    return `${color}${status}\x1b[0m`;
  });

  const format =
    ":method :url :statusColor :res[content-length] - :response-time ms";

  app.use(morgan(format));

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          connectSrc: ["'self'", "https://prompt-fast-mule.ngrok-free.app"],
        },
      },
    })
  );

  // static file
  app.use("/static", express.static(folderPathStatic));

  // setup Db
  await setupDB(MONGODB_URL, MONGODB_DB_NAME);

  // setup router
  await setupRouter(app);

  app.listen(PORT, () =>
    logger.info(`Server running on http://localhost:${PORT}`)
  );
}

serverRunner();
