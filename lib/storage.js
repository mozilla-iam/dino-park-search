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

  async bulk(bulk) {
    logger.info(`caging ${bulk.length} scrubbed dinos`);
    await this.client.bulk({ body: bulk });
    return this.client.indices.refresh({ index: this.indices });
  }

  static _simpleQuery(query) {
    return {
      query: {
        multi_match: {
          query,
          fields: FIELDS
        }
      }
    };
  }
}

export { Storage as default };