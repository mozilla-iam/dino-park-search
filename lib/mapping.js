import { logger } from "./config";

const DOC_MAPPING = {
  _doc: {
    properties: {
      alternativeName: { type: "text" },
      costCenter: { type: "keyword" },
      created: { type: "date" },
      description: { type: "text" },
      firstName: { type: "text" },
      funTitle: { type: "text" },
      groups: { type: "keyword" },
      identities: { type: "keyword" },
      isStaff: { type: "boolean" },
      languages: { type: "keyword" },
      lastName: { type: "text" },
      location: { type: "text" },
      name: { type: "text" },
      officeLocation: { type: "text" },
      picture: { enabled: false },
      primaryEmail: { type: "keyword" },
      tags: { type: "keyword" },
      team: { type: "text" },
      timezone: { type: "keyword" },
      title: { type: "text" },
      userId: { type: "keyword" },
      username: { type: "keyword" },
      workerType: { type: "keyword" }
    }
  }
};

function flattenValues(o) {
  if ("values" in o && o.values !== null) {
    return Object.entries(o.values).map(([_, v]) => v);
  }
  return null;
}

function flattenKeys(o) {
  if ("values" in o && o.values !== null) {
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
      return obj[prop] || { value: null };
    }
  };
  const p = new Proxy(scrubbedProfile, emptyHandler);
  const staff = new Proxy(scrubbedProfile.staff_information, emptyHandler);
  try {
    return {
      alternativeName: p.alternative_name.value,
      created: p.created.value,
      description: p.description.value,
      firstName: p.first_name.value,
      funTitle: p.fun_title.value,
      languages: flattenValues(p.languages),
      lastName: p.last_name.value,
      location: p.location.value,
      picture: p.picture.value,
      primaryEmail: p.primary_email.value,
      tags: flattenValues(p.tags),
      timezone: p.timezone.value,
      userId: p.user_id.value,
      username: p.primary_username.value,

      // unify name to allow for first_name last_name search
      name: unifiedName(p),

      groups:
        (scrubbedProfile.access_information &&
          scrubbedProfile.access_information.mozilliansorg &&
          flattenKeys(scrubbedProfile.access_information.mozilliansorg)) ||
        null,

      // staff things
      isStaff: staff.staff.value || false,
      title: staff.title.value,
      officeLocation: staff.office_location.value,
      workerType: staff.worker_type.value,
      costCenter: staff.cost_center.value,
      team: staff.team.value
    };
  } catch (e) {
    logger.error(`faild to map profile: ${e}`);
    throw e;
  }
}

const SIMPLE_SEARCH_FIELDS = [
  "firstName",
  "funTitle",
  "lastName",
  "location",
  "name",
  "officeLocation",
  "primaryEmail",
  "title",
  "username"
];

const FIELDS = [
  "firstName",
  "funTitle",
  "lastName",
  "location",
  "officeLocation",
  "picture",
  "primaryEmail",
  "title",
  "username",
  "isStaff"
];

export { DOC_MAPPING, FIELDS, SIMPLE_SEARCH_FIELDS, mapDoc };
