import elasticsearch from "elasticsearch";
import connectionClass from "http-aws-es";

import { logger } from "./config";
import { LEVELS } from "./filter";
import { DOC_MAPPING, FIELDS, SIMPLE_SEARCH_FIELDS } from "./mapping";

const TYPE_PREFIX = "search-dino";

class Storage {
  constructor(cfg, esClient = elasticsearch.Client) {
    this.cfg = cfg;
    const options = {
      host: this.cfg.elasticHost
    };
    if (cfg.elasticAwsDefaultRegion !== "") {
      options.connectionClass = connectionClass;
    }
    this.client = new esClient(options);
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

  async simpleSearch(query, level, _which) {
    const index = this.indexFor(level);
    const type = this.typeFor(level);
    let which = [true, false];
    if (_which === "staff") {
      which = [true];
    } else if (_which === "contributors") {
      which = [false];
    }

    logger.info(`looking at ${level} -> ${index}`);
    const exists = await this.client.indices.exists({ index });
    if (!exists) {
      return [];
    }
    logger.info("searching…");
    try {
      const body = Storage._simpleQuery(query, which);
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
    } catch (e) {
      logger.error("something went wrong during search");
      throw new Error("bad search input");
    }
  }

  async getDino(dinoId, level) {
    const index = this.indexFor(level);
    const type = this.typeFor(level);

    const response = await this.client.get({
      index,
      type,
      id: dinoId,
      _sourceInclude: "_doc"
    });
    if (response._source && response._source._doc) {
      return response._source._doc;
    }
    return {};
  }

  async getDinoBy(key, value, level) {
    const index = this.indexFor(level);
    const type = this.typeFor(level);

    logger.info(`getting by ${key} for ${value} at ${level} -> ${index}`);
    const exists = await this.client.indices.exists({ index });
    if (!exists) {
      logger.error(`index ${index} does not exist`);
      throw new Error("index not there");
    }
    logger.info("looking up…");
    try {
      let response = await this.client.search({
        index,
        type,
        size: 2,
        body: {
          query: {
            term: {
              [key]: value
            }
          }
        },
        _sourceInclude: "_doc"
      });
      if (response.hits.total != 1) {
        logger.error(`found multiple profiles for ${username}`);
        throw new Error("doomsday");
      }
      logger.info(`found ${response.hits.total} dinos`);
      const dino = response.hits.hits.map(hit => hit._source)[0]._doc;
      return dino;
    } catch (e) {
      logger.error("something went wrong during lookup");
      throw new Error("bad search input");
    }
  }

  async bulk(bulk) {
    return this.client.bulk({ body: bulk, refresh: true });
  }

  static _simpleQuery(q, which) {
    if (q.search(/[\+\-\*\(\):|"~]/g) === -1) {
      return {
        query: {
          bool: {
            must: {
              simple_query_string: {
                query: this._fuzzUp(q),
                fields: SIMPLE_SEARCH_FIELDS
              }
            },
            filter: {
              terms: {
                isStaff: which
              }
            }
          }
        }
      };
    } else {
      return {
        query: {
          bool: {
            must: {
              query_string: {
                query: q,
                fields: SIMPLE_SEARCH_FIELDS
              }
            },
            filter: {
              terms: {
                isStaff: which
              }
            }
          }
        }
      };
    }
  }

  static _fuzzUp(query) {
    const trimmed = query.trim();
    if (trimmed.length === 1) {
      return `${trimmed}*`;
    }
    const parts = trimmed.split(" ");
    const last = parts.pop();
    const fuzz = parts.map(i => i + "~1").join(" + ");
    return `(${fuzz} + ${last}*) | (${fuzz} + ${last}~1)`;
  }
}

export { Storage as default };
