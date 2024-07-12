import { DEV, STAGE, PROD } from "./constants";
import { ConfigConstants } from "../types";

const environment = process.env.NODE_ENV;

const constants = DEV;

// let constants: ConfigConstants;
// if (environment === "production") {
//   constants = PROD;
// } else if (environment === "staging") {
//   constants = STAGE;
// } else {
//   constants = DEV;
// }
export default constants;
