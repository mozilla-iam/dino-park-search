import elasticsearch from "elasticsearch";
import connectionClass from "http-aws-es";

import { logger } from "./config";
import { LEVELS } from "./filter";
import { DOC_MAPPING, FIELDS, SIMPLE_SEARCH_FIELDS } from "./mapping";

const TYPE_PREFIX = "search-dino";

function generateIndexNames(prefix) {
  return new Map(
    Object.entries(LEVELS).map(([_, level]) => [level, `${prefix}-${level}`])
  );
}

function indexFor(level, indices) {
  return indices.get(level);
}

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

    this.migration =
      this.cfg.elasticIndexPrefix !== this.cfg.elasticNextIndexPrefix;

    this.indices = generateIndexNames(this.cfg.elasticIndexPrefix);
    this.nextIndices = generateIndexNames(this.cfg.elasticNextIndexPrefix);

    this.types = new Map(
      Object.entries(LEVELS).map(([_, level]) => [
        level,
        `${TYPE_PREFIX}-${level}`
      ])
    );
    this.deleteConfirmationTimer = null;
  }

  async init() {
    await this.createIndieces(this.indices);
    if (this.migration) {
      await this.createIndieces(this.nextIndices);
    }
    return this;
  }

  async createIndieces(indices) {
    for (const [_, level] of Object.entries(LEVELS)) {
      const index = indexFor(level, indices);
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
  }

  async simpleSearch(query, level, _which, after) {
    const index = indexFor(level, this.indices);
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
      if (after) {
        try {
          const search_after = JSON.parse(
            Buffer.from(after, "base64").toString()
          );
          body["search_after"] = search_after;
        } catch (e) {
          logger.warn(`Unable to base64 decode after: ${after}`);
        }
      }
      let response = await this.client.search({
        index,
        size: 100,
        _source: FIELDS,
        sort: ["_score:desc", "username:asc"],
        body
      });
      logger.info(`found ${response.hits.total} dinos`);
      const dinos = response.hits.hits.map(hit => hit._source);
      const { sort } =
        dinos.length > 0
          ? response.hits.hits[dinos.length - 1]
          : { sort: [null, null] };
      const next = Buffer.from(JSON.stringify(sort)).toString("base64");
      return {
        total: response.hits.total,
        next,
        dinos
      };
    } catch (e) {
      logger.error("something went wrong during search");
      throw new Error("bad search input");
    }
  }

  toBulk({ operation, level, id, doc = {} }, indices) {
    const index = indexFor(level, indices);
    switch (operation) {
      case "delete":
        return [{ [operation]: { _index: index, _id: id, _type: "_doc" } }];
      case "index":
        return [
          { [operation]: { _index: index, _id: id, _type: "_doc" } },
          doc
        ];
      default:
        logger.error(`unsupportet bulk operation: ${operation}`);
        return [];
    }
  }

  async bulkForIndices(bulk, indices) {
    const body = bulk.flatMap(job => this.toBulk(job, indices));
    return this.client.bulk({ body, refresh: true });
  }

  async bulk(bulk) {
    let r = await this.bulkForIndices(bulk, this.indices);
    if (this.migration) {
      r = await this.bulkForIndices(bulk, this.nextIndices);
    }
    return r;
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
            should: [
              {
                multi_match: {
                  query: q,
                  fields: SIMPLE_SEARCH_FIELDS
                }
              },
              {
                multi_match: {
                  query: q,
                  type: "phrase",
                  fields: SIMPLE_SEARCH_FIELDS
                }
              }
            ],
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
