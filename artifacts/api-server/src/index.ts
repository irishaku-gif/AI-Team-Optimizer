import app from "./app";
import { loadConfig } from "./config";
import { logger } from "./lib/logger";

const { port } = loadConfig();

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
