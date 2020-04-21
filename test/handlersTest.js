import EventEmitter from "events";

import "mocha";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { createRequest, createResponse } from "node-mocks-http";

chai.use(chaiAsPromised);
chai.should();

import Handlers from "../lib/handlers";

describe("Express handlers", () => {
  it("createBulkHandler", async () => {
    const files = {
      data: {
        data: "[]",
      },
    };
    const cage = {
      bulkInsert: async (profiles) => {
        profiles.length.should.be.equal(0);
        return {};
      },
    };
    const handlers = new Handlers(cage);
    const handle = handlers.createBulkHandler();
    const req = createRequest({ method: "POST", files });
    const res = createResponse({
      eventEmitter: EventEmitter,
    });

    const result = new Promise((resolve) => {
      res.on("end", () => {
        res._isEndCalled().should.be.true;
        res.statusCode.should.be.equal(200);
        JSON.parse(res._getData()).should.be.deep.equal({
          status: "updated",
        });
        resolve();
      });
    });

    handle(req, res);

    return result;
  });

  it("createBulkHandler fails", async () => {
    const files = {
      data: {
        data: "[]",
      },
    };
    const cage = {
      bulkInsert: async () => {
        return Promise.reject("FAIL");
      },
    };
    const handlers = new Handlers(cage);
    const handle = handlers.createBulkHandler();
    const req = createRequest({ method: "POST", files });
    const res = createResponse({
      eventEmitter: EventEmitter,
    });

    const result = new Promise((resolve) => {
      res.on("end", () => {
        res._isEndCalled().should.be.true;
        res.statusCode.should.be.equal(503);
        JSON.parse(res._getData()).should.be.deep.equal({
          error: "FAIL",
        });
        resolve();
      });
    });

    handle(req, res);

    return result;
  });

  it("createUpdateHandler", async () => {
    const body = {};
    const cage = {
      updateDino: async (profile) => {
        profile.should.be.deep.equal({});
        return {};
      },
    };
    const handlers = await new Handlers(cage);
    const handle = handlers.createUpdateHandler();
    const req = createRequest({ method: "POST", body });
    const res = createResponse({
      eventEmitter: EventEmitter,
    });

    const result = new Promise((resolve) => {
      res.on("end", () => {
        res._isEndCalled().should.be.true;
        res.statusCode.should.be.equal(200);
        JSON.parse(res._getData()).should.be.deep.equal({
          status: "updated",
        });
        resolve();
      });
    });

    handle(req, res);

    return result;
  });

  it("createUpdateHandler fails", async () => {
    const body = {};
    const cage = {
      updateDino: async () => {
        return Promise.reject("FAIL");
      },
    };
    const handlers = new Handlers(cage);
    const handle = handlers.createUpdateHandler();
    const req = createRequest({ method: "POST", body });
    const res = createResponse({
      eventEmitter: EventEmitter,
    });

    const result = new Promise((resolve) => {
      res.on("end", () => {
        res._isEndCalled().should.be.true;
        res.statusCode.should.be.equal(503);
        JSON.parse(res._getData()).should.be.deep.equal({
          error: "FAIL",
        });
        resolve();
      });
    });

    handle(req, res);

    return result;
  });

  it("createDeleteHandler", async () => {
    const cage = {
      deleteDino: async (userId) => {
        userId.should.be.equal("user1");
        return {};
      },
    };
    const handlers = new Handlers(cage);
    const handle = handlers.createDeleteHandler();
    const req = createRequest({
      method: "POST",
      params: { dinoId: "user1" },
    });
    const res = createResponse({
      eventEmitter: EventEmitter,
    });

    const result = new Promise((resolve) => {
      res.on("end", () => {
        res._isEndCalled().should.be.true;
        res.statusCode.should.be.equal(200);
        JSON.parse(res._getData()).should.be.deep.equal({
          status: "deleted",
        });
        resolve();
      });
    });

    handle(req, res);

    return result;
  });

  it("createDeleteHandler fails", async () => {
    const cage = {
      deleteDino: async () => {
        return Promise.reject("FAIL");
      },
    };
    const handlers = new Handlers(cage);
    const handle = handlers.createDeleteHandler();
    const req = createRequest({
      method: "POST",
      params: { dinoId: "user1" },
    });
    const res = createResponse({
      eventEmitter: EventEmitter,
    });

    const result = new Promise((resolve) => {
      res.on("end", () => {
        res._isEndCalled().should.be.true;
        res.statusCode.should.be.equal(503);
        JSON.parse(res._getData()).should.be.deep.equal({
          error: "FAIL",
        });
        resolve();
      });
    });

    handle(req, res);

    return result;
  });
});

describe("Search Handlers", () => {
  it("simple search handler", async () => {
    const cage = {
      simpleSearch: async (query, level, which) => {
        query.should.be.equal("foobar");
        level.should.be.equal("public");
        which.should.be.equal("all");

        return { dinos: [] };
      },
    };
    const handlers = new Handlers(cage);
    const handle = handlers.createSimpleSearchQueryHandler();
    const req = createRequest({
      method: "GET",
      params: { scope: "public" },
      query: { q: "foobar" },
    });
    const res = createResponse({
      eventEmitter: EventEmitter,
    });

    const result = new Promise((resolve) => {
      res.on("end", () => {
        res._isEndCalled().should.be.true;
        res.statusCode.should.be.equal(200);
        JSON.parse(res._getData()).should.be.deep.equal({
          dinos: [],
        });
        resolve();
      });
    });

    handle(req, res);

    return result;
  });

  it("simple search handler", async () => {
    const cage = {
      simpleSearch: async (query, level, which) => {
        query.should.be.equal("foobar");
        level.should.be.equal("public");
        which.should.be.equal("all");

        return { dinos: [] };
      },
    };
    const handlers = new Handlers(cage);
    const handle = handlers.createSimpleSearchHandler();
    const req = createRequest({
      method: "GET",
      params: { scope: "public", query: "foobar" },
    });
    const res = createResponse({
      eventEmitter: EventEmitter,
    });

    const result = new Promise((resolve) => {
      res.on("end", () => {
        res._isEndCalled().should.be.true;
        res.statusCode.should.be.equal(200);
        JSON.parse(res._getData()).should.be.deep.equal({
          dinos: [],
        });
        resolve();
      });
    });

    handle(req, res);

    return result;
  });
});
