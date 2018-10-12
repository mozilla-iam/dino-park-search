import "mocha";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import sinon from "sinon";

import { TEST_CONFIG } from "./configs";
import App from "../lib/app";
import * as Http from "http";

chai.use(chaiAsPromised);
chai.should();

describe("App", () => {
  let listen;
  let close;

  beforeEach(() => {
    listen = sinon.stub(Http.Server.prototype, "listen");
    close = sinon.stub(Http.Server.prototype, "close");
  });

  afterEach(() => {
    listen.restore();
    close.restore();
  });

  it("run", () => {
    close.yields();
    const app = new App(TEST_CONFIG);
    app.run();
    app.stop();
  });

  it("run → fail to close", () => {
    const app = new App(TEST_CONFIG);
    app.run();
    return app.stop().should.be.rejected;
  });
});
