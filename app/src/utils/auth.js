import jwt from "jsonwebtoken";
import { DefaultAzureCredential } from "@azure/identity";
import { Unauthorized, InternalError } from "../error/index.js";
import { getTableClient, getEntity } from "./tableStorage.js";

const jwtSecret = process.env.JWT_SECRET;

export async function verifyAuth(cookieHeader) {
  const token = parseCookie(cookieHeader)?.github_session;
  if (!token) {
    throw Unauthorized({
      meta: { reason: "missing_cookie" },
    });
  }

  let userId, login;
  try {
    const decoded = await authenticateJWT(token);
    userId = decoded.id;
    login = decoded.login;
  } catch (err) {
    throw Unauthorized({
      cause: err,
      meta: { reason: "invalid_token" },
    });
  }

  let entity;
  try {
    const tokensClient = getTableClient({ tableName: "tokens" });
    entity = await getEntity(tokensClient, String(userId), login);
  } catch (err) {
    throw InternalError({
      cause: err,
      meta: { reason: "storage_read_failed" },
    });
  }

  return {
    user: { userId, login },
    accessToken: entity.accessToken,
  };
}

export function parseCookie(cookie = "") {
  return Object.fromEntries(
    cookie.split(";").map((c) => {
      const [k, v] = c.trim().split("=");
      return [k, v];
    }),
  );
}

function authenticateJWT(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, jwtSecret, (err, decoded) => {
      if (err) return reject(new Error("invalid_token"));

      resolve(decoded);
    });
  });
}
