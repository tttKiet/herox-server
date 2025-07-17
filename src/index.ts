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

  // Set timeout to 5 minutes for long-running requests
  app.use((req, res, next) => {
    // 300000 milliseconds = 5 minutes
    res.setTimeout(300000, () => {
      logger.error("Request timeout:", req.path);
      res.status(503).send({
        error: "Request timeout",
        message: "Server took too long to respond",
      });
    });
    next();
  });

  app.use(express.json()); // parse application/json
  app.use(express.urlencoded({ extended: true })); // parse application/x-www-form-urlencoded

  // Sử dụng morgan để log ngày giờ phút giây khi có request nếu LOG_DEBUG=true
  if (process.env.LOG_DEBUG === "true") {
    morgan.token("custom-date", () => {
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, "0");
      const h = pad(now.getHours());
      const m = pad(now.getMinutes());
      const s = pad(now.getSeconds());
      const d = pad(now.getDate());
      const mo = pad(now.getMonth() + 1);
      const y = now.getFullYear();
      return `${h}:${m}:${s} ${d}/${mo}/${y}`;
    });
    app.use(
      morgan(
        ":custom-date [:method] :url :status :res[content-length] - :response-time ms"
      )
    );
  }

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
