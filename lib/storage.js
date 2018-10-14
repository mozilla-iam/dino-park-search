import fs from "fs";
import elasticsearch from "elasticsearch";

import { logger } from "./config";
import { LEVELS } from "./filter";
import { MAPPING, FIELDS } from "./mapping";

const TYPE_PREFIX = "search-dino";

class Storage {
  constructor(cfg, esClient = elasticsearch.Client) {
    this.cfg = cfg;
    this.client = new esClient({
      host: this.cfg.elasticHost
    });
    this.indices = new Map(
      Object.entries(LEVELS).map(([_, level]) => [
        level,
        `search-${this.cfg.elasticIndexPrefix}-${level}`
      ])
    );
    console.log(`indices ${[...this.indices.entries()]}`);
    this.types = new Map(
      Object.entries(LEVELS).map(([_, level]) => [
        level,
        `${TYPE_PREFIX}-${level}`
      ])
    );
  }

  indexFor(level) {
    return this.indices.get(level);
  }

  typeFor(level) {
    return this.types.get(level);
  }

  async simpleSearch(query, level) {
    const index = this.indexFor(level);
    const type = this.typeFor(level);

    logger.info(`looking at ${level} -> ${index}`);
    const exists = await this.client.indices.exists({ index });
    if (!exists) {
      return [];
    }
    logger.info("searching…");
    const body = Storage._simpleQuery(query);
    logger.info(`body: ${JSON.stringify(body)}`);
    let response = await this.client.search({
      index,
      type,
      scroll: "30s",
      size: 100,
      body,
      _sourceInclude: FIELDS
    });
    logger.info(`found ${response.hits.total} dinos`);
    logger.info(`returning ${response.hits.total} dinos`);
    const dinos = response.hits.hits.map(hit => hit._source);
    return {
      total: response.hits.total,
      scroll: response._scroll_id,
      dinos
    };
  }

  async getDino(userId, level) {
    const index = this.indexFor(level);
    const type = this.typeFor(level);

    const response = await this.client.get({
      index,
      type,
      id: userId
    });
    return response._source;
  }

  async bulk(bulk) {
    logger.info(`caging ${bulk.length} scrubbed dinos`);
    return this.client.bulk({ body: bulk, refresh: true });
  }

  static _simpleQuery(query) {
    return {
      query: {
        query_string: {
          query,
          fields: FIELDS
        }
      }
    };
  }
}

export { Storage as default };
