import LRU from "lru-cache";

import { mapDoc } from "./mapping";
import { LEVELS, filterJsonObject } from "./filter";

import { logger } from "./config";

class Cage {
  constructor(storage) {
    const CACHE_SIZE = 5000;
    this.storage = storage;
    this.idCache = LRU(CACHE_SIZE);
  }

  async simpleSearch(query, level) {
    logger.info(`searching for (${level}): "${query}"`);
    return this.storage.simpleSearch(query, level);
  }

  async getDino(username, level) {
    let dinoId = this.idCache.get(username);
    if (dinoId) {
      logger.info(`getting ${username} (${dinoId})`);
      return this.storage.getDino(dinoId, level);
    } else {
      logger.info(`getting by username ${username}`);
      const dino = await this.storage.getDinoByUsername(username, level);
      const { dinoId, username: newUserName } = getDinoIdAndUsername(dino);
      if (username !== newUserName) {
        logger.error(
          `username missmatch ${username} vs ${newUserName} for ${dinoId}`
        );
        throw new Error("non-unique dinoId");
      }
      this.idCache.set(username, dinoId);
      return dino;
    }
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
    const { dinoId, username } = getDinoIdAndUsername(profile);
    const cachedDinoId = this.cache.get(username);
    if (cachedDinoId && cachedDinoId !== dinoId) {
      logger.error(
        `account takeover?  ${username} has cached id: ${cachedDinoId} but ${dinoId} in update`
      );
      throw new Error("colliding dinoId");
    }
    logger.info(`updating ${dinoId}`);
    return this.storage.bulk(this._scrub2FullBulkIndex(profile));
  }

  async deleteDino(dinoId) {
    logger.info(`deleting ${dinoId} from all levels`);
    const bulk = [];
    for (const [_, level] of Object.entries(LEVELS)) {
      const _index = this.storage.indexFor(level);
      const _type = this.storage.typeFor(level);
      const del = { delete: { _index, _type, _id: dinoId } };
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
    const _id = getDinoIdAndUsername(profile).dinoId;
    const scrubbed = filterJsonObject(profile, level);
    const doc = mapDoc(scrubbed);
    return [{ index: { _index, _type, _id } }, doc];
  }
}

function getDinoIdAndUsername(dino) {
  try {
    const dinoId = dino.identities.dinopark_id.value;
    const username = dino.usernames.values.mozilliansorg;
    if (dinoId) {
      return { dinoId, username };
    }
  } catch (e) {
    logger.error(
      `profile without dinopark_id or username! ${dino &&
        JSON.stringify(dino.user_id)}`
    );
  }
  throw new Error("no dinopark_id/username");
}

export { Cage as default };
