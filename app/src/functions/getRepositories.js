import { app } from "@azure/functions";
import { App } from "octokit";
import { TableClient } from "@azure/data-tables";
import jwt from "jsonwebtoken";
import { log } from "console";

app.http("getRepositories", {
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
      const tableClient = TableClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING, "tokens");
      const { accessToken } = await tableClient.getEntity(String(userId), login); // TODO: need to decrypt access token

      // get  repos
      const repos = await fetch("https://api.github.com/user/repos", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }).then((r) => r.json());
      console.log("👀user Repos", repos);
      const repoList = repos.map((repo) => ({ name: repo.name, id: repo.id, full_name: repo.full_name }));
      console.log("User orgs", repoList);
      return {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "http://localhost:5173",
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
        jsonBody: { success: true, repoList },
      };
    } catch (err) {
      context.log(err);

      return {
        status: 500,
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
