import { logger } from "./config";

const DOC_MAPPING = {
  properties: {
    active: { type: "boolean" },
    alternative_name: { type: "text" },
    cost_center: { type: "keyword" },
    created: { type: "date" },
    description: { type: "text" },
    first_name: { type: "text" },
    fun_title: { type: "text" },
    groups: { type: "keyword" },
    identities: { type: "keyword" },
    is_staff: { type: "boolean" },
    languages: { type: "keyword" },
    last_name: { type: "text" },
    location: { type: "text" },
    name: { type: "text" },
    office_location: { type: "text" },
    picture: { enabled: false },
    primary_email: { type: "keyword" },
    tags: { type: "keyword" },
    team: { type: "text" },
    timezone: { type: "keyword" },
    title: { type: "text" },
    user_id: { type: "keyword" },
    usernames: { type: "keyword" },
    worker_type: { type: "keyword" },
    _doc: { enabled: false }
  }
};

function flattenValues(o) {
  if ("values" in o) {
    return Object.entries(o.values).map(([_, v]) => v);
  }
  return null;
}

function flattenKeys(o) {
  if ("values" in o) {
    return Object.entries(o.values).map(([k, _]) => k);
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
      if (obj[prop] !== null) {
        if (typeof obj[prop] === "object") {
          return new Proxy(obj[prop], emptyHandler);
        } else {
          return obj[prop];
        }
      } else {
        return { value: null };
      }
    }
  };
  const p = new Proxy(scrubbedProfile, emptyHandler);
  try {
    return {
      active: p.active.value,
      alternative_name: p.alternative_name.value,
      created: p.created.value,
      description: p.description.value,
      first_name: p.first_name.value,
      fun_title: p.fun_title.value,
      languages: flattenValues(p.languages),
      last_name: p.last_name.value,
      location: p.location.value,
      picture: p.picture.value,
      primary_email: p.primary_email.value,
      tags: flattenValues(p.tags),
      timezone: p.timezone.value,
      user_id: p.user_id.value,
      usernames:
        p.usernames && p.usernames.values && p.usernames.values.mozillians,

      // unify name to allow for first_name last_name search
      name: unifiedName(p),

      groups:
        p.access_information &&
        p.access_information.mozilliansorg &&
        flattenKeys(p.access_information.mozilliansorg),

      // staff things
      is_staff: p.staff_information && p.staff_information.staff.value,
      title: p.staff_information && p.staff_information.title.value,
      office_location:
        p.staff_information && p.staff_information.office_location.value,
      worker_type: p.staff_information && p.staff_information.worker_type.value,
      cost_center: p.staff_information && p.staff_information.cost_center.value,
      team: p.staff_information && p.staff_information.team.value,

      _doc: scrubbedProfile
    };
  } catch (e) {
    logger.error(`faild to map profile: ${e}`);
    throw e;
  }
}

const SIMPLE_SEARCH_FIELDS = [
  "first_name",
  "fun_title",
  "last_name",
  "location",
  "name",
  "office_location",
  "primary_email",
  "title",
  "usernames"
];

const FIELDS = [
  "first_name",
  "fun_title",
  "last_name",
  "location",
  "office_location",
  "picture",
  "primary_email",
  "title",
  "user_id"
];

export { DOC_MAPPING, FIELDS, SIMPLE_SEARCH_FIELDS, mapDoc };
