import { logger } from "./config";

class Handlers {
  constructor(cage) {
    this.cage = cage;
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
