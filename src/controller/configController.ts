import { DEV, STAGE, PROD } from "../constants";
import { ConfigConstants, EnvOption } from "../types";
import { ConfigView } from "../views/configView";

export class ConfigController {
  public constants: ConfigConstants;

  constructor() {
    const environment = process.env.NODE_ENV;
    this.constants = this.setEnvironment(environment);
  }

  setEnvironment(environment: string | undefined) {
    if (environment === EnvOption.Dev) {
      this.constants = PROD;
    } else if (environment === EnvOption.Stage) {
      this.constants = STAGE;
    } else {
      this.constants = DEV;
    }
    return this.constants;
  }

  async changeEnv() {
    const env = await ConfigView.promptEnvironment();
    if (env) {
      this.setEnvironment(env);
      ConfigView.promptEnvChange(env);
    }
  }
}
