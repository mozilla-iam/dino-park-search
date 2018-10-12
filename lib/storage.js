import fs from "fs";
import elasticsearch from "elasticsearch";

import { logger } from "./config";
import { LEVELS } from "./filter";

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
    this.types = new Map(
      Object.entries(LEVELS).map(([_, level]) => [
        level,
        `${TYPE_PREFIX}-${level}`
      ])
    );
  }

  indexFor(level) {
    return this.types.get(level);
  }

  typeFor(level) {
    return this.types.get(level);
  }

  async bulk(bulk) {
    logger.info(`caging ${bulk.length} scrubbed dinos`);
    await this.client.bulk({ body: bulk });
    return this.client.indices.refresh({ index: this.indices });
  }

  async getDinos(level) {
    const index = this.indexFor(level);
    const type = this.typeFor(level);

    const exists = await this.client.indices.exists({ index });
    if (!exists) {
      return [];
    }
    let response = await this.client.search({
      index,
      type,
      scroll: "30s",
      size: 100
    });
    logger.info(`found ${response.hits.total} dinos`);
    const dinos = response.hits.hits.map(hit => hit._source);
    return {
      total: response.hits.total,
      scroll: response._scroll_id,
      dinos
    };
  }
}

export { Storage as default };
