const LEVELS = {
  public: "public",
  registered: "registered",
  vouched: "vouched",
  ndad: "ndad",
  staff: "staff",
  private: "private"
};

function filterJsonObject(o, level = LEVELS.public, filter = () => true) {
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
    if (filter(level, o)) {
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
