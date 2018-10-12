import { promisify } from "util";
import fs from "fs";

import { load } from "../lib/config";
import { TEST_CONFIG } from "./configs";

import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import mock from "mock-fs";
import tmp from "tmp";

chai.use(chaiAsPromised);
chai.should();

describe("Everything configy", () => {
  describe("config validation", () => {
    afterEach(() => {
      mock.restore();
    });

    it("validate valid config", done => {
      tmp.file((_, path, fd) =>
        promisify(fs.write)(fd, JSON.stringify(TEST_CONFIG))
          .then(() => load(path) && done())
          .catch(e => done(e))
      );
    });

    it("error on empty config", done => {
      tmp.file((_, path, fd) =>
        promisify(fs.write)(fd, JSON.stringify({}))
          .then(() => (() => load(path)).should.throw() && done())
          .catch(e => done(e))
      );
    });

    it("error on no config", () => {
      (() => load()).should.throw();
    });
  });
});
