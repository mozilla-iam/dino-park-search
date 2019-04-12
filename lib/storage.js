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
    this.deleteConfirmationTimer = null;
  }

  async init() {
    for (const [_, level] of Object.entries(LEVELS)) {
      const index = this.indexFor(level);
      const exists = await this.client.indices.exists({ index });
      if (exists) {
        continue;
      }
      logger.info(`creating index: ${index}`);

      await this.client.indices.create({
        index,
        body: { mappings: DOC_MAPPING }
      });
    }
    return this;
  }

  indexFor(level) {
    return this.indices.get(level);
  }

  async simpleSearch(query, level, _which) {
    const index = this.indexFor(level);
    let which = [true, false];

    // The front-end originally used the term "contributor" to refer to unpaid
    // contributors. It now uses the term "volunteer" instead. To support older
    // versions of the front-end, both values are currently accepted. This may
    // not be needed for long; few bookmarks were likely created before the
    // change to "volunteer" was made.
    if (_which === "staff") {
      which = [true];
    } else if (_which === "volunteers" || _which === "contributors") {
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
        scroll: "30s",
        size: 100,
        body
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

  async bulk(bulk) {
    return this.client.bulk({ body: bulk, refresh: true });
  }

  async recreateIndices() {
    if (this.deleteConfirmationTimer !== null) {
      clearTimeout(this.deleteConfirmationTimer);
      this.deleteConfirmationTimer = null;
      const params = {
        index: [...this.indices.values()]
      };
      logger.info(`deleting ${JSON.stringify(params)}`);
      try {
        await this.client.indices.delete(params);
        await this.init();
      } catch (e) {
        logger.error(e);
      }
      return { recreate: "done" };
    } else {
      this.deleteConfirmationTimer = setTimeout(() => {
        logger.warn("recreation not confirmed");
        this.deleteConfirmationTimer = null;
      }, 2000);
      return { recreate: "confirm please" };
    }
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
    if (trimmed.length < 3) {
      return `${trimmed}*`;
    }
    const parts = trimmed.split(" ");
    if (parts.length == 2) {
      let [a, b] = parts;
      return `(${a}* + ${b}*) | (${a}* + ${b}~1) | (${a}~1 + ${b}*) | (${a}~1 + ${b}~1)`;
    }
    const last = parts.pop();
    const fuzz = parts.map(i => i + "~1").join(" + ");
    return `(${fuzz} + ${last}*) | (${fuzz} + ${last}~1)`;
  }
}

export { Storage as default };
