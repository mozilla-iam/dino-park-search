import { logger } from "./config";

const LEVELS = {
  public: "public",
  authenticated: "authenticated",
  vouched: "vouched",
  ndaed: "ndaed",
  staff: "staff",
  private: "private",
};

const DISPLAY_MATRIX = {
  public: new Set([LEVELS.public]),
  authenticated: new Set([LEVELS.public, LEVELS.authenticated]),
  vouched: new Set([LEVELS.public, LEVELS.authenticated, LEVELS.vouched]),
  ndaed: new Set([
    LEVELS.public,
    LEVELS.authenticated,
    LEVELS.vouched,
    LEVELS.ndaed,
  ]),
  staff: new Set([
    LEVELS.public,
    LEVELS.authenticated,
    LEVELS.vouched,
    LEVELS.ndaed,
    LEVELS.staff,
  ]),
  private: new Set([
    LEVELS.public,
    LEVELS.authenticated,
    LEVELS.vouched,
    LEVELS.ndaed,
    LEVELS.staff,
    LEVELS.private,
  ]),
};

function displayFilter(o, level = LEVELS.public) {
  if ("metadata" in o) {
    if ("display" in o.metadata) {
      return DISPLAY_MATRIX[level].has(o.metadata.display);
    }
    return false;
  }
  return true;
}

function filterJsonObject(o, level = LEVELS.public, filter = displayFilter) {
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
      .map((v) => filterJsonObject(v, level, filter))
      .filter((v) => v !== null);
    return filteredArray;
  } else {
    if (filter(o, level)) {
      const filteredObject = {};
      Object.entries(o).forEach(([k, v]) => {
        if (k === "user_id" && level === LEVELS.private) {
          filteredObject[k] = { value: v.value || "" };
        } else {
          filteredObject[k] = filterJsonObject(v, level, filter);
        }
      });
      if (Object.entries(filteredObject).length) {
        return filteredObject;
      }
    }
  }
  return null;
}

export { LEVELS, filterJsonObject };
