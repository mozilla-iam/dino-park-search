import { mapDoc } from "./mapping";
import { LEVELS, filterJsonObject } from "./filter";

import { logger } from "./config";

class Cage {
  constructor(storage) {
    this.storage = storage;
  }

  async recreateIndices() {
    const r = await this.storage.recreateIndices();
    logger.warn(`recreating indices: ${r.recreate}`);
    return r;
  }

  async simpleSearch(query, level, which, after) {
    logger.info(`searching for (${level}): "${query}" (${which})`);
    return this.storage.simpleSearch(query, level, which, after);
  }

  async bulkInsert(profiles) {
    logger.info("scrubbing…");
    const scrubbedBulk = [];
    for (const p of profiles) {
      scrubbedBulk.push(...this._scrub2FullBulkIndex(p));
    }
    logger.info(
      `got ${scrubbedBulk.length / Object.entries(LEVELS).length} clean dinos`
    );
    try {
      const r = await this.storage.bulk(scrubbedBulk);
      if (r.errors) {
        logger.error("error while bulk inserting");
        throw new Error("error while bulk inserting");
      }
    } catch (e) {
      logger.error("error while bulk inserting");
      throw new Error("error while bulk inserting");
    }
    return {};
  }

  async updateDino(profile) {
    logger.info(`updating ${profile.user_id.value}`);
    return this.storage.bulk(this._scrub2FullBulkIndex(profile));
  }

  async deleteDino(dinoId) {
    logger.info(`deleting ${dinoId} from all levels`);
    const bulk = [];
    for (const [_, level] of Object.entries(LEVELS)) {
      const del = { operation: "delete", level, id: dinoId };
      bulk.push(del);
    }
    return this.storage.bulk(bulk);
  }

  _scrub2FullBulkIndex(profile) {
    const scrubbed = [];
    for (const [_, level] of Object.entries(LEVELS)) {
      scrubbed.push(this._scrub2BulkIndex(profile, level));
    }
    return scrubbed;
  }

  _scrub2BulkIndex(profile, level) {
    const active = profile.active.value || false;
    const id = getId(profile);
    if (active) {
      const scrubbed = filterJsonObject(profile, level);
      const doc = mapDoc(scrubbed);
      return { operation: "index", level, id, doc };
    } else {
      logger.info(`deleting ${profile.user_id.value} (${level})`);
      return { operation: "delete", level, id };
    }
  }
}

function getId(dino) {
  try {
    const dinoId = dino.uuid.value;
    if (dinoId) {
      return dinoId;
    }
  } catch (e) {
    logger.error(`profile without uuid! ${dino && JSON.stringify(dino.uuid)}`);
  }
  throw new Error("no dinopark_id/username");
}

export { Cage as default };
