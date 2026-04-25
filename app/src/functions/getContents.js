import { app } from "@azure/functions";
import { App } from "octokit";
import { TableClient } from "@azure/data-tables";
import jwt from "jsonwebtoken";

app.http("getContents", {
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
      const tableClient = TableClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING, "tokens");
      const { accessToken } = await tableClient.getEntity(String(userId), login); // TODO: need to decrypt access token

      const githubApp = new App({
        appId: process.env.APP_ID,
        privateKey: Buffer.from(process.env.PRIVATE_KEY, "base64").toString("utf8"),
      });

      const path = request.query.get("path");
      const type = request.query.get("type");
      const owner = request.query.get("owner");
      const repo = request.query.get("repo");
      const ref = request.query.get("ref") ?? "main";

      const installationClient = TableClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING, "installations");
      const { installationId } = await installationClient.getEntity("account", `${type}:${owner}`);
      console.log("👍Found installation entity", installationId);
      const octokit = await githubApp.getInstallationOctokit(installationId);
      const { data } = await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
        owner,
        repo,
        path,
        ref,
      });
      const content = Buffer.from(data.content, "base64").toString("utf8");

      return {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "http://localhost:5173",
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
        jsonBody: { success: true, content },
      };
    } catch (err) {
      context.log(err);

      return {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "http://localhost:5173",
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
