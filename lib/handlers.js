import { logger } from "./config";
import { LEVELS } from "./filter";

class Handlers {
  constructor(cage) {
    this.cage = cage;
  }

  createSimpleSearchQueryHandler() {
    return (req, res) => {
      const scope = req.params.scope || LEVELS.public;
      const query = req.query.q || "";
      const which = req.query.w || "all";
      const after = req.query.a;
      this.cage
        .simpleSearch(query, scope, which, after)
        .then((hits) => {
          res.json(hits);
        })
        .catch((e) => {
          res.status(503);
          res.json({ error: e });
        });
    };
  }

  createSimpleSearchHandler() {
    return (req, res) => {
      const scope = req.params.scope || LEVELS.public;
      const query = req.params.query || "";
      const which = req.query.w || "all";
      const after = req.query.a;
      this.cage
        .simpleSearch(query, scope, which, after)
        .then((hits) => {
          res.json(hits);
        })
        .catch((e) => {
          res.status(503);
          res.json({ error: e });
        });
    };
  }

  createBulkHandler() {
    return (req, res) => {
      const s = req.files.data.data.toString("utf8");
      const profiles = JSON.parse(`${s}`);
      this.cage
        .bulkInsert(profiles)
        .then(() => {
          res.json({ status: "updated" });
        })
        .catch((e) => {
          res.status(503);
          res.json({ error: e });
        });
    };
  }

  createUpdateHandler() {
    return (req, res) => {
      this.cage
        .updateDino(req.body)
        .then(() => {
          res.json({ status: "updated" });
        })
        .catch((e) => {
          res.status(503);
          res.json({ error: e });
        });
    };
  }

  createDeleteHandler() {
    return (req, res) => {
      this.cage
        .deleteDino(req.params.dinoId)
        .then(() => {
          res.json({ status: "deleted" });
        })
        .catch((e) => {
          res.status(503);
          res.json({ error: e });
        });
    };
  }

  createUuidByUserIdHandler() {
    return (req, res) => {
      this.cage
        .getUuidByUserId(req.params.userId)
        .then((r) => {
          res.json(r);
        })
        .catch((e) => {
          res.status(503);
          res.json({ error: e });
        });
    };
  }

  createRecreateHandler() {
    return (_, res) => {
      this.cage
        .recreateIndices()
        .then((r) => {
          res.json(r);
        })
        .catch((e) => {
          res.status(503);
          res.json({ error: e });
        });
    };
  }
}

export { Handlers as default };
