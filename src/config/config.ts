import { DEV, STAGE, PROD } from "./constants";
import { configConstants } from "../types";

const environment = process.env.NODE_ENV;

let constants: configConstants;
if (environment === "production") {
  constants = PROD;
} else if (environment === "staging") {
  constants = STAGE;
} else {
  constants = DEV;
}
export default constants;
