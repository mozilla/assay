import { DEV, STAGE, PROD } from "../constants";
import { ConfigConstants } from "../types";
import { ConfigView } from "../views/configView";

export class ConfigController {
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

  async changeEnv() {
    const env = await ConfigView.promptEnvironment();
    if (env) {
      this.setEnvironment(env.toLowerCase());
      ConfigView.promptEnvChange(env);
    }
  }
}
