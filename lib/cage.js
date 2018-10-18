import { mapDoc } from "./mapping";
import { LEVELS, filterJsonObject } from "./filter";

import { logger } from "./config";

class Cage {
  constructor(storage) {
    this.storage = storage;
  }

  async simpleSearch(query, level) {
    logger.info(`searching for (${level}): "${query}"`);
    return this.storage.simpleSearch(query, level);
  }

  async getDino(userId, level) {
    logger.info(`getting ${userId}`);
    return this.storage.getDino(userId, level);
  }

  async bulkInsert(profiles) {
    logger.info("scrubbing…");
    const scrubbedBulk = [];
    for (const p of profiles) {
      scrubbedBulk.push(...this._scrub2FullBulkIndex(p));
    }
    logger.info(
      `got ${scrubbedBulk.length /
        (Object.entries(LEVELS).length * 2)} clean dinos`
    );
    const r = await this.storage.bulk(scrubbedBulk);
    if (r.errors) {
      logger.error("error while bulk inserting");
      throw new Error("error while bulk inserting");
    }
    return {};
  }

  async updateDino(profile) {
    logger.info(`updating ${profile.user_id.value}`);
    return this.storage.bulk(this._scrub2FullBulkIndex(profile));
  }

  async deleteDino(userId) {
    logger.info(`deleting ${userId} from all levels`);
    const bulk = [];
    for (const [_, level] of Object.entries(LEVELS)) {
      const _index = this.storage.indexFor(level);
      const _type = this.storage.typeFor(level);
      const del = { delete: { _index, _type, _id: userId } };
      bulk.push(del);
    }
    return this.storage.bulk(bulk);
  }

  _scrub2FullBulkIndex(profile) {
    const scrubbed = [];
    for (const [_, level] of Object.entries(LEVELS)) {
      scrubbed.push(...this._scrub2BulkIndex(profile, level));
    }
    return scrubbed;
  }

  _scrub2BulkIndex(profile, level) {
    const _index = this.storage.indexFor(level);
    const _type = this.storage.typeFor(level);
    const _id = profile.user_id.value;
    const scrubbed = filterJsonObject(profile, level);
    const doc = mapDoc(scrubbed);
    return [{ index: { _index, _type, _id } }, doc];
  }
}

export { Cage as default };
