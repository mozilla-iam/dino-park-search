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
});

describe("fuzzy", () => {
  it("fuzz up two strings", async () => {
    const q = "foo bar 2000";
    const query = Storage._fuzzUp(q);
    query.should.be.equal("(foo~1 + bar~1 + 2000*) | (foo~1 + bar~1 + 2000~1)");
  });

  it("don't fuzz up one char", () => {
    const q = "9";
    const query = Storage._fuzzUp(q);
    query.should.be.equal("9*");
  });

  it("don't fuzz up two chars", () => {
    const q = "fo";
    const query = Storage._fuzzUp(q);
    query.should.be.equal("fo*");
  });

  it("fuzz up three chars", () => {
    const q = "foo";
    const query = Storage._fuzzUp(q);
    query.should.be.equal("( + foo*) | ( + foo~1)");
  });

  it("trim whitespace", () => {
    const q = "foo bar 2000 ";
    const query = Storage._fuzzUp(q);
    query.should.be.equal("(foo~1 + bar~1 + 2000*) | (foo~1 + bar~1 + 2000~1)");
  });

  it("2 terms", () => {
    const q = "foo bar";
    const query = Storage._fuzzUp(q);
    query.should.be.equal(
      "(foo* + bar*) | (foo* + bar~1) | (foo~1 + bar*) | (foo~1 + bar~1)"
    );
  });
});
