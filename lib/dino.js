import { LEVELS, filterJsonObject } from "./filter";

class Dino {
  constructor(profile) {
    this.profile = profile;
  }
  get public() {
    return filterJsonObject(this.profile, LEVELS.public);
  }
  get registered() {
    return filterJsonObject(this.profile, LEVELS.registered);
  }
  get public() {
    return filterJsonObject(this.profile, LEVELS.public);
  }
  get ndad() {
    return filterJsonObject(this.profile, LEVELS.ndad);
  }
  get staff() {
    return filterJsonObject(this.profile, LEVELS.staff);
  }
  get private() {
    return filterJsonObject(this.profile, LEVELS.private);
  }
}

export { Dino };
