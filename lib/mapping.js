import { logger } from "./config";

const DOC_MAPPING = {
  properties: {
    active: { type: "boolean" },
    alternative_name: { type: "text" },
    business_title: { type: "text" },
    cost_center: { type: "keyword" },
    created: { type: "date" },
    description: { type: "text" },
    entity: { type: "text" },
    first_name: { type: "text" },
    fun_title: { type: "text" },
    identities: { type: "keyword" },
    last_name: { type: "text" },
    location_preference: { type: "text" },
    office_location: { type: "text" },
    picture: { enabled: false },
    preferred_languages: { type: "keyword" },
    primary_email: { type: "keyword" },
    primary_work_email: { type: "keyword" },
    public_email_addresses: { type: "keyword" },
    tags: { type: "keyword" },
    team: { type: "text" },
    timezone: { type: "keyword" },
    user_id: { type: "keyword" },
    usernames: { type: "keyword" },
    worker_type: { type: "keyword" },
    name: { type: "text" },
    _doc: { enabled: false }
  }
};

function flattenValues(o) {
  if ("values" in o) {
    return Object.entries(o.values).map(([_, v]) => v);
  }
  return null;
}

function unifiedName(p) {
  if (p.first_name.value && p.last_name.value) {
    return `${p.first_name.value} ${p.last_name.value}`;
  }
  return p.first_name.value || p.last_name.value || null;
}

function mapDoc(scrubbedProfile) {
  const emptyHandler = {
    get: (obj, prop) => {
      return obj[prop] || { value: null };
    }
  };
  const p = new Proxy(scrubbedProfile, emptyHandler);
  try {
    return {
      active: p.active.value,
      alternative_name: p.alternative_name.value,
      business_title: p.business_title.value,
      cost_center: p.cost_center.value,
      created: p.created.value,
      description: p.description.value,
      entity: p.entity.value,
      first_name: p.first_name.value,
      fun_title: p.fun_title.value,
      last_name: p.last_name.value,
      location_preference: p.location_preference.value,
      office_location: p.office_location.value,
      picture: p.picture.value,
      preferred_languages: flattenValues(p.preferred_languages),
      primary_email: p.primary_email.value,
      primary_work_email: p.primary_work_email.value,
      tags: flattenValues(p.tags),
      team: p.team.value,
      timezone: p.timezone.value,
      user_id: p.user_id.value,
      usernames:
        p.usernames && p.usernames.values && p.usernames.values.mozillians,
      worker_type: p.worker_type.value,
      name: unifiedName(p),
      _doc: scrubbedProfile
    };
  } catch (e) {
    logger.error(`faild to map profile: ${e}`);
    throw e;
  }
}

const SIMPLE_SEARCH_FIELDS = [
  "primary_email",
  "first_name",
  "last_name",
  "name",
  "fun_title",
  "location_preference",
  "office_location",
  "usernames"
];

const FIELDS = [
  "user_id",
  "primary_email",
  "first_name",
  "last_name",
  "picture",
  "fun_title",
  "location_preference",
  "office_location"
];

export { DOC_MAPPING, FIELDS, SIMPLE_SEARCH_FIELDS, mapDoc };
