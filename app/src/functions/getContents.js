import { app } from "@azure/functions";
import { App } from "octokit";
import { getTableClient } from "../utils/tableStorage.js";
import { verifyAuth } from "../utils/auth.js";

app.http("getContents", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    try {
      const { accessToken } = await verifyAuth(request.headers.get("cookie"));

      const githubApp = new App({
        appId: process.env.GITHUB_APP_ID,
        privateKey: Buffer.from(process.env.GITHUB_APP_PRIVATE_KEY, "base64").toString("utf8"),
      });

      const path = request.query.get("path");
      const type = request.query.get("type");
      const owner = request.query.get("owner");
      const repo = request.query.get("repo");
      const ref = request.query.get("ref") ?? "main";

      const installationClient = getTableClient({ tableName: "installations" });
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

      const allowedOrigin = getAllowedOrigin(request.headers.get("origin"));
      return {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": allowedOrigin,
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
        jsonBody: { success: true, content },
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
