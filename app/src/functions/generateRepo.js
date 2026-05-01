import { app } from "@azure/functions";
import { Octokit } from "octokit";
import { verifyAuth } from "../utils/auth.js";

app.http("generateRepo", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    try {
      const template_owner = "ZenMe-AU";
      const template_repo = "ZBCorpArchitecture";

      const { accessToken } = await verifyAuth(request.headers.get("cookie"));

      // only use oauth token to generate repo
      const octokit = new Octokit({
        auth: accessToken,
      });
      const body = await request.json();
      console.log("👍body", body);
      const { isPrivate = true, includeAllBranch = false, owner, type, repo = template_repo } = body;
      // const installationClient = getTableClient({ tableName: "installations" });
      // const { installationId } = await installationClient.getEntity("account", `${type}:${owner}`);
      // const githubApp = new App({
      //   appId: process.env.GITHUB_APP_ID,
      //   privateKey: Buffer.from(process.env.GITHUB_APP_PRIVATE_KEY, "base64").toString("utf8"),
      // });
      // const octokit = await githubApp.getInstallationOctokit(installationId);
      const res = await octokit.request(`POST /repos/{template_owner}/{template_repo}/generate`, {
        template_owner,
        template_repo,
        owner,
        name: repo,
        include_all_branches: includeAllBranch,
        private: isPrivate,
        headers: {
          "X-GitHub-Api-Version": "2026-03-10",
        },
      });
      console.log("👍res", res);
      const allowedOrigin = getAllowedOrigin(request.headers.get("origin"));
      return {
        status: res.status,
        headers: {
          "Access-Control-Allow-Origin": allowedOrigin,
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
        jsonBody: { success: true },
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
