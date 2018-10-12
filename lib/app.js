import http from "http";

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
    this.shutdownTimeout = cfg.shutdownTimeout;
    this.app = express();
    this.app.use(bodyParser.json());
    this.app.use(fileUpload());
  }

  init(cfg) {
    const storage = new Storage(cfg);
    const cage = new Cage(storage);
    const handlers = new Handlers(cage);

    //this.app.get("/search/get/:scope/:userId", handlers.createGetHandler());
    //this.app.get(
    //  "/search/simple/:scope/:query",
    //  handlers.createSimpleHandler()
    //);
    //this.app.get(
    //  "/search/complex/:scope/:query",
    //  handlers.createComplexHandler()
    //);
    this.app.post("/search/update", handlers.createUpdateHandler());
    this.app.post("/search/delete/:userId", handlers.createDeleteHandler());
    this.app.post("/search/bulk", handlers.createBulkHandler());
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
