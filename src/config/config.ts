import { DEV, STAGE, PROD } from "./constants";
import { configConstants } from "../amo/types";

const environment = process.env.NODE_ENV;

let constants: configConstants;
if (environment === "development") {
  constants = DEV;
} else if (environment === "staging") {
  constants = STAGE;
} else {
  constants = PROD;
}
export default constants;
