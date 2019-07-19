import { load, logger } from "./lib/config";
import App from "./lib/app";

let app;

async function main() {
  try {
    const cfg = load(process.env["CONFIG_FILE"]);

    app = new App(cfg);
    await app.init(cfg);
    logger.info(`starting to serve on port: ${cfg.port}`);
    app.run();
  } catch (e) {
    logger.error(`Something went wrong: ${e}`);
    process.exit(1);
  }
}

async function shutdown() {
  try {
    logger.info("shutting down…");
    await app.stop();
    logger.info("shut down gracefully :)");
    process.exit(0);
  } catch (e) {
    logger.error(`failed to stop: ${e}`);
    logger.error("exiting with exit code 1 :/");
    process.exit(1);
  }
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

main();
