import { logger } from "./config";

const LEVELS = {
  public: "public",
  authenticated: "authenticated",
  vouched: "vouched",
  ndad: "ndad",
  staff: "staff",
  private: "private"
};

const VISIBILITIES = {
  public: new Set([LEVELS.public]),
  authenticated: new Set([LEVELS.public, LEVELS.authenticated]),
  vouched: new Set([LEVELS.public, LEVELS.authenticated, LEVELS.vouched]),
  ndad: new Set([
    LEVELS.public,
    LEVELS.authenticated,
    LEVELS.vouched,
    LEVELS.ndad
  ]),
  staff: new Set([
    LEVELS.public,
    LEVELS.authenticated,
    LEVELS.vouched,
    LEVELS.ndad,
    LEVELS.staff
  ]),
  private: new Set([
    LEVELS.public,
    LEVELS.authenticated,
    LEVELS.vouched,
    LEVELS.ndad,
    LEVELS.staff,
    LEVELS.private
  ])
};

function visibilityFilter(o, level = LEVELS.public) {
  if ("metadata" in o) {
    if ("visibility" in o.metadata) {
      return VISIBILITIES[level].has(o.metadata.visibility);
    }
    return false;
  }
  return true;
}

function filterJsonObject(o, level = LEVELS.public, filter = visibilityFilter) {
  if (o === null) {
    return o;
  }
  switch (typeof o) {
    case "boolean":
    case "number":
    case "string":
      return o;
  }
  if (Array.isArray(o)) {
    const filteredArray = o
      .map(v => filterJsonObject(v, level, filter))
      .filter(v => v !== null);
    return filteredArray;
  } else {
    if (filter(o, level)) {
      const filteredObject = {};
      Object.entries(o).forEach(([k, v]) => {
        filteredObject[k] = filterJsonObject(v, level, filter);
      });
      if (Object.entries(filteredObject).length) {
        return filteredObject;
      }
    }
  }
  return null;
}

export { LEVELS, filterJsonObject };
