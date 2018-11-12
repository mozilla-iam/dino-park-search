import "mocha";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";

chai.use(chaiAsPromised);
chai.should();

import { TEST_CONFIG } from "./configs";
import Storage from "../lib/storage";

function makeEs() {
  class Es {
    constructor() {
      this.indices = {};
      this.indices.exists = async () => true;
      this.indices.create = async () => null;
    }
  }
  return Es;
}

describe("constructor", () => {
  it("constructor success", async () => {
    const es = makeEs();
    const storage = await new Storage(TEST_CONFIG, es).init();
    storage.should.exist;
  });

  it("constructor success", async () => {
    const q = "foo bar";
    const query = Storage._fuzzUp(q);
    query.should.be.equal("(foo~1 + bar*) | (foo~1 + bar~1)");
  });
});
