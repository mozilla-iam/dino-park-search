const MAPPING = {
  properties: {
    user_id: {
      type: "object",
      store: true
    },
    primary_email: {
      type: "object",
      store: true
    },
    first_name: {
      type: "object",
      store: true
    },
    last_name: {
      type: "object",
      store: true
    },
    fun_title: {
      type: "object",
      store: true
    },
    location_preference: {
      type: "object",
      store: true
    },
    office_location: {
      type: "object",
      store: true
    }
  }
};

const FIELDS = [...Object.keys(MAPPING.properties).map(f => `${f}.value`)];

export { MAPPING, FIELDS };
