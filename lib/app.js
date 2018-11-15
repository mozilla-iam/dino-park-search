import http from "http";
import path from "path";

import express from "express";
import bodyParser from "body-parser";
import fileUpload from "express-fileupload";

import { logger } from "./config";

import Cage from "./cage";
import Storage from "./storage";
import Handlers from "./handlers";

class App {
  constructor(cfg) {
    this.port = cfg.port;
    this.basePath = cfg.basePath;
    this.shutdownTimeout = cfg.shutdownTimeout;
    this.app = express();
    this.app.use(bodyParser.json());
    this.app.use(fileUpload());
  }

  _base(_path) {
    const p = path.join(this.basePath, _path);
    logger.info(`mounting ${p}`);
    return p;
  }

  async init(cfg) {
    const storage = await new Storage(cfg).init();
    const cage = new Cage(storage);
    const handlers = new Handlers(cage);

    this.app.get(
      this._base("/search/get/:scope/:username"),
      handlers.createGetHandler()
    );
    this.app.get(
      this._base("/search/getByUserId/:userId"),
      handlers.createGetByUserIdHandler()
    );
    this.app.get(
      this._base("/search/simple/:scope/:query"),
      handlers.createSimpleSearchHandler()
    );
    //this.app.get(
    //  "/search/complex/:scope/:query",
    //  handlers.createComplexHandler()
    //);
    this.app.post(this._base("/search/update"), handlers.createUpdateHandler());
    this.app.post(
      this._base("/search/delete/:dinoId"),
      handlers.createDeleteHandler()
    );
    this.app.post(this._base("/search/bulk"), handlers.createBulkHandler());
  }

  run() {
    this.server = http.createServer(this.app);
    return this.server.listen(this.port);
  }

  stop() {
    let timer;
    const killer = new Promise((_, reject) => {
      timer = setTimeout(
        () => reject(new Error("timed out closing http server")),
        this.shutdownTimeout
      );
    });
    const close = new Promise(resolve =>
      this.server.close(() => {
        clearTimeout(timer);
        resolve();
      })
    );
    return Promise.race([close, killer]);
  }
}

export { App as default };
