import winston from "winston";
import convict from "convict";

const logger = winston.createLogger({
  transports: [new winston.transports.Console()],
  format: winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.simple()
  )
});

const SCHEMA = {
  port: {
    doc: "The port to bind.",
    format: "port",
    default: 8889,
    env: "PORT",
    arg: "port"
  },
  shutdownTimeout: {
    doc: "Grace period after SIGINT/SIGTERM.",
    format: "duration",
    default: 1000,
    env: "SHUTDOWN_TIMEOUT"
  },
  basePath: {
    doc: "Base path for API endpoints",
    format: "String",
    default: "/",
    env: "BASE_PATH"
  },
  elasticHost: {
    doc: "ES host with port.",
    format: "String",
    default: null,
    env: "ELASTIC_HOST"
  },
  elasticAwsDefaultRegion: {
    doc: "Use AWS ES with default region",
    format: "String",
    default: "",
    env: "AWS_DEFAULT_REGION"
  },
  elasticIndexPrefix: {
    doc: "ES index name.",
    format: "String",
    default: "v2-dino-park-search",
    env: "ELASTIC_INDEX_PREFIX"
  },
  elasticNextIndexPrefix: {
    doc: "next ES index name (for migration, default to elasticIndexPrefix).",
    format: "String",
    default: "v2-dino-park-search",
    env: "ELASTIC_NEXT_INDEX_PREFIX"
  }
};

function load(configFile) {
  const CONFIG = convict(SCHEMA);
  try {
    if (configFile) {
      CONFIG.loadFile(configFile);
    }
    CONFIG.validate({ allowed: "strict" });
    return CONFIG.getProperties();
  } catch (e) {
    throw new Error(`error reading config: ${e}`);
  }
}

export { load, logger, SCHEMA };
