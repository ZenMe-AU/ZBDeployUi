import { app } from "@azure/functions";
import { Octokit } from "octokit";
import { verifyAuth } from "../utils/auth.js";
import { corsWrapper } from "../utils/cors.js";

app.http("generateRepo", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: corsWrapper(async (request, context) => {
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
    return {
      jsonBody: { success: true },
    };
  }),
});
