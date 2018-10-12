import { LEVELS, filterJsonObject } from "./filter";

import { logger } from "./config";

class Cage {
  constructor(storage) {
    this.storage = storage;
  }

  async bulkInsert(profiles) {
    logger.info("scrubbing…");
    const scrubbedBulk = [];
    for (const p of profiles) {
      scrubbedBulk.push(...this._scrub2BulkFull(p));
    }
    logger.info(`got ${scrubbedBulk.length} clean dinos`);
    return this.storage.bulk(scrubbedBulk);
  }

  _scrub2BulkFull(profile) {
    const scrubbed = [];
    for (const [_, level] of Object.entries(LEVELS)) {
      scrubbed.push(...this._scrub2Bulk(profile, level));
    }
    return scrubbed;
  }

  _scrub2Bulk(profile, level) {
    const _index = this.storage.indexFor(level);
    const _type = this.storage.typeFor(level);
    const _id = profile.user_id.value;
    const doc = filterJsonObject(profile, level);
    return [{ index: { _index, _type, _id } }, doc];
  }
}

export { Cage as default };
