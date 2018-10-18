import chai from "chai";
import chaiAsPromised from "chai-as-promised";

chai.use(chaiAsPromised);
chai.should();

import { LEVELS, filterJsonObject } from "../lib/filter";

describe("filter JSON objects (default filter)", () => {
  for (const prim of [null, true, false, 1, 1.1, "foobar", ""]) {
    it(`filter primitve ${prim}`, () => {
      let res = filterJsonObject(prim);
      chai.expect(res).to.be.equal(prim);
    });
  }

  it("true filter echoes objects", () => {
    let jo = {
      a: [],
      b: [1]
    };
    let res = filterJsonObject(jo, LEVELS.public, () => true);
    chai.expect(res).to.be.deep.equal(jo);
  });

  it("true filter echoes simple arrays", () => {
    let jo = [1, 2];
    let res = filterJsonObject(jo, LEVELS.public, () => true);
    chai.expect(res).to.be.deep.equal(jo);
  });

  it("true filter filters nulls in arrays", () => {
    let jo = { a: [1, 2, { b: 3 }], c: 4 };
    let res = filterJsonObject(jo, LEVELS.public, () => true);
    chai.expect(res).to.be.deep.equal(jo);
  });

  it("false filter", () => {
    let jo = [1, 2, { a: 3 }];
    let res = filterJsonObject(jo, LEVELS.public, () => false);
    chai.expect(res).to.be.deep.equal([1, 2]);
  });
});
