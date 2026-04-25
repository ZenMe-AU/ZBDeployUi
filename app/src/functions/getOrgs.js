import { app } from "@azure/functions";
import { App } from "octokit";
import { TableClient } from "@azure/data-tables";
import jwt from "jsonwebtoken";
import { log } from "console";

app.http("getOrgs", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    try {
      const cookie = request.headers.get("cookie");
      const token = parseCookie(cookie)?.github_session;
      if (!token) {
        return { status: 401, jsonBody: { loggedIn: false } };
      }
      const { id: userId, login } = await authenticateJWT(token);
      console.log("Authenticated user", { userId, login });
      const tokenClient = TableClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING, "tokens");
      const installationClient = TableClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING, "installations");
      const { accessToken } = await tokenClient.getEntity(String(userId), login); // TODO: need to decrypt access token
      // // get user repos
      // const userRepos = await fetch("https://api.github.com/user/repos", {
      //   headers: {
      //     Authorization: `Bearer ${accessToken}`,
      //   },
      // }).then((r) => r.json());
      // console.log(" user Repos", userRepos);
      const isUserInstalled = await installationClient.getEntity("account", `User:${login}`).then(
        () => true,
        (err) => {
          if (err.statusCode === 404) {
            // 404 means not found (not installed), other errors should be thrown
            return false;
          }
          throw err;
        },
      );

      // get orgs
      const orgs = await fetch("https://api.github.com/user/orgs", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }).then((r) => r.json());

      // const orgList = orgs.map((org) => ({ login: org.login, id: org.id }));
      const orgList = await Promise.all(
        orgs.map(async (org) => {
          let isInstalled = false;
          try {
            await installationClient.getEntity("account", `Organization:${org.login}`);
            isInstalled = true;
          } catch (err) {
            if (err.statusCode !== 404) {
              // 404 means not found (not installed), other errors should be thrown
              throw err;
            }
          }

          return {
            login: org.login,
            id: org.id,
            isInstalled,
          };
        }),
      );
      console.log("User orgs", orgList);
      const allowedOrigin = getAllowedOrigin(request.headers.get("origin"));
      return {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": allowedOrigin,
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
        jsonBody: { success: true, orgList, user: { login, id: userId, isInstalled: isUserInstalled } },
      };
    } catch (err) {
      context.log(err);

      const allowedOrigin = getAllowedOrigin(request.headers.get("origin"));
      return {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": allowedOrigin,
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
        jsonBody: { error: err.message },
      };
    }
  },
});

function parseCookie(cookieHeader = "") {
  return Object.fromEntries(
    cookieHeader
      .split("; ")
      .filter(Boolean)
      .map((v) => {
        const [key, ...rest] = v.split("=");
        return [key, rest.join("=")];
      }),
  );
}

function authenticateJWT(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return reject(new Error("Invalid token"));

      console.log("🛄 Decoded JWT", decoded);
      resolve(decoded);
    });
  });
}

function getAllowedOrigin(origin) {
  if (!origin) return "";
  let parsedOrigin;
  try {
    parsedOrigin = new URL(origin).origin;
  } catch {
    return "";
  }
  const allowList = (process.env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim());
  if (allowList.includes(parsedOrigin)) {
    return parsedOrigin;
  }

  return "";
}
