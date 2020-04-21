import { logger } from "./config";

const USERNAMES = ["HACK#BMOMAIL", "HACK#BMONICK", "HACK#GITHUB"];
const URIS = ["EA#SLACK", "EA#IRC"];

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
      secondaryEmail: { type: "keyword" },
      tags: { type: "keyword" },
      team: { type: "text" },
      timezone: { type: "keyword" },
      title: { type: "text" },
      uris: { type: "keyword" },
      userId: { type: "keyword" },
      username: { type: "keyword" },
      usernames: { type: "keyword" },
      workerType: { type: "keyword" },
    },
  },
};

function prefixFilter(prefixes) {
  return (v) => prefixes.some((prefix) => v.startsWith(prefix));
}

function flattenValues(o, filter = () => true) {
  if ("values" in o && o.values !== null) {
    return Object.entries(o.values)
      .filter(([k]) => filter(k))
      .map(([_, v]) => v);
  }
  return [];
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
    },
  };
  const p = new Proxy(scrubbedProfile, emptyHandler);
  const staff = new Proxy(scrubbedProfile.staff_information, emptyHandler);
  const identities = new Proxy(scrubbedProfile.identities, emptyHandler);
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
      secondaryEmail:
        identities.custom_1_primary_email.value ||
        identities.custom_2_primary_email.value,
      tags: flattenValues(p.tags),
      timezone: p.timezone.value,
      userId: p.user_id.value,
      username: p.primary_username.value,
      usernames: flattenValues(p.usernames, prefixFilter(USERNAMES)),
      uris: flattenValues(p.uris, prefixFilter(URIS)),

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
      team: staff.team.value,
    };
  } catch (e) {
    logger.error(`faild to map profile: ${e}`);
    throw e;
  }
}

const SIMPLE_SEARCH_FIELDS = [
  "alternativeName",
  "firstName",
  "funTitle",
  "lastName",
  "location",
  "name",
  "officeLocation",
  "primaryEmail",
  "secondaryEmail",
  "title",
  "uris",
  "username",
  "usernames",
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
  "isStaff",
];

export { DOC_MAPPING, FIELDS, SIMPLE_SEARCH_FIELDS, mapDoc };
