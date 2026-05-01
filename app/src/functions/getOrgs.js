import { app } from "@azure/functions";
import { App } from "octokit";
import { verifyAuth } from "../utils/auth.js";
import { getTableClient } from "../utils/tableStorage.js";

app.http("getOrgs", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    try {
      const { user, accessToken } = await verifyAuth(request.headers.get("cookie"));
      const { userId, login } = user;
      // // get user repos
      // const userRepos = await fetch("https://api.github.com/user/repos", {
      //   headers: {
      //     Authorization: `Bearer ${accessToken}`,
      //   },
      // }).then((r) => r.json());
      // console.log(" user Repos", userRepos);
      const installationClient = getTableClient({ tableName: "installations" });
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
