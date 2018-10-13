import { logger } from "./config";
import { LEVELS } from "./filter";

class Handlers {
  constructor(cage) {
    this.cage = cage;
  }

  createGetHandler() {
    return (req, res) => {
      const scope = req.params.scope || LEVELS.public;
      const userId = req.params.userId || "NaU";
      this.cage
        .getDino(userId, scope)
        .then(hits => {
          res.json(hits);
        })
        .catch(e => {
          res.status(503);
          res.json({ error: e });
        });
    };
  }

  createSimpleSearchHandler() {
    return (req, res) => {
      const scope = req.params.scope || LEVELS.public;
      const query = req.params.query || "";
      this.cage
        .simpleSearch(query, scope)
        .then(hits => {
          res.json(hits);
        })
        .catch(e => {
          res.status(503);
          res.json({ error: e });
        });
    };
  }

  createBulkHandler() {
    return (req, res) => {
      const s = req.files.data.data.toString("ascii");
      const profiles = JSON.parse(s);
      this.cage
        .bulkInsert(profiles)
        .then(() => {
          res.json({ status: "updated" });
        })
        .catch(e => {
          res.status(503);
          res.json({ error: e });
        });
    };
  }

  createUpdateHandler() {
    return (req, res) => {
      this.cage
        .update(req.body)
        .then(() => {
          res.json({ status: "updated" });
        })
        .catch(e => {
          res.status(503);
          res.json({ error: e });
        });
    };
  }

  createDeleteHandler() {
    return (req, res) => {
      this.cage
        .deleteDino(req.params.userId)
        .then(() => {
          res.json({ status: "deleted" });
        })
        .catch(e => {
          res.status(503);
          res.json({ error: e });
        });
    };
  }
}

export { Handlers as default };
