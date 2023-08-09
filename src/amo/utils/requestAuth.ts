import * as jwt from "jsonwebtoken";

import { getCredsFromStorage } from "../commands/getApiCreds";

// as per https://addons-server.readthedocs.io/en/latest/topics/api/auth.html
export async function makeToken() {
  const { apiKey, secret } = await getCredsFromStorage();

  const issuedAt = Math.floor(Date.now() / 1000);
  const payload = {
    iss: apiKey,
    jti: Math.random().toString(),
    iat: issuedAt,
    exp: issuedAt + 60,
  };

  return jwt.sign(payload, secret, { algorithm: "HS256" });
}

export async function makeAuthHeader() {
  const token = await makeToken();
  return { Authorization: `JWT ${token}` };
}
