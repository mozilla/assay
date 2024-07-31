import { DEV, STAGE, PROD } from "./constants";
import { ConfigConstants } from "../types";

export class Config {
  public constants: ConfigConstants;

  constructor() {
    const environment = process.env.NODE_ENV;
    this.constants = this.setEnvironment(environment);
  }

  setEnvironment(environment: string | undefined) {
    if (environment === "production") {
      this.constants = PROD;
    } else if (environment === "staging") {
      this.constants = STAGE;
    } else {
      this.constants = DEV;
    }
    return this.constants;
  }
}
