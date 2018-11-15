import LRU from "lru-cache";

import { mapDoc } from "./mapping";
import { LEVELS, filterJsonObject } from "./filter";

import { logger } from "./config";

class Cage {
  constructor(storage) {
    const CACHE_SIZE = 5000;
    this.storage = storage;
    this.usernameCache = LRU(CACHE_SIZE);
    this.userIdCache = LRU(CACHE_SIZE);
  }

  async simpleSearch(query, level) {
    logger.info(`searching for (${level}): "${query}"`);
    return this.storage.simpleSearch(query, level);
  }

  async getDinoByUserId(username) {
    return this.getDinoBy(
      "username",
      username,
      LEVELS.private,
      this.userIdCache
    );
  }

  async getDino(username, level) {
    return this.getDinoBy("username", username, level, this.usernameCache);
  }

  async getDinoBy(key, value, level, cache) {
    let dinoId = cache.get(value);
    if (dinoId) {
      logger.info(`getting ${value} (${dinoId})`);
      return this.storage.getDino(dinoId, level);
    } else {
      logger.info(`getting by ${key}: ${value}`);
      const dino = await this.storage.getDinoBy(key, value, level);
      const { dinoId, [key]: newValue } = getIds(dino);
      if (value !== newValue) {
        logger.error(
          `username missmatch in ${key}: ${value} vs ${newValue} for ${dinoId}`
        );
        throw new Error("non-unique dinoId");
      }
      cache.set(value, dinoId);
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
    const _id = getIds(profile).dinoId;
    const scrubbed = filterJsonObject(profile, level);
    const doc = mapDoc(scrubbed);
    return [{ index: { _index, _type, _id } }, doc];
  }
}

function getIds(dino) {
  try {
    const dinoId = dino.identities.dinopark_id.value;
    const username = dino.usernames.values.mozilliansorg;
    const userId = dino.user_id.value;
    if (dinoId && userId) {
      return { dinoId, userId, username };
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
