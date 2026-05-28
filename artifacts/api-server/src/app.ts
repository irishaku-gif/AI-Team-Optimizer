import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { loadConfig } from "./config";
import { errorHandler } from "./middlewares/error-handler";
import { createRepositories } from "./repositories";
import { createApiRouter } from "./routes";
import { createServices } from "./services";
import { logger } from "./lib/logger";

const app: Express = express();
const config = loadConfig();
const repositories = createRepositories(config.storageMode);
const services = createServices(repositories, logger);

logger.info({ storageMode: config.storageMode }, "Storage mode selected");

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", createApiRouter(services));
app.use(errorHandler);

export default app;
