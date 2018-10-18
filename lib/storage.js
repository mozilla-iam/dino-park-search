import fs from "fs";
import elasticsearch from "elasticsearch";

import { logger } from "./config";
import { LEVELS } from "./filter";
import { DOC_MAPPING, FIELDS } from "./mapping";

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
        `${this.cfg.elasticIndexPrefix}-${level}`
      ])
    );
    this.types = new Map(
      Object.entries(LEVELS).map(([_, level]) => [
        level,
        `${TYPE_PREFIX}-${level}`
      ])
    );
  }

  async init() {
    for (const [_, level] of Object.entries(LEVELS)) {
      const index = this.indexFor(level);
      const type = this.typeFor(level);
      const exists = await this.client.indices.exists({ index });
      if (exists) {
        continue;
      }
      logger.info(`creating index: ${index}`);

      await this.client.indices.create({
        index,
        body: { mappings: { [type]: DOC_MAPPING } }
      });
    }
    return this;
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
    let response = await this.client.search({
      index,
      type,
      scroll: "30s",
      size: 100,
      body,
      _sourceInclude: FIELDS
    });
    logger.info(`found ${response.hits.total} dinos`);
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
      id: userId,
      _sourceInclude: "_doc"
    });
    return response._source;
  }

  async bulk(bulk) {
    return this.client.bulk({ body: bulk, refresh: true });
  }

  static _simpleQuery(query) {
    return {
      query: {
        simple_query_string: {
          query,
          fields: FIELDS
        }
      }
    };
  }
}

export { Storage as default };
