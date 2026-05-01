import { app } from "@azure/functions";
import { App } from "octokit";
import { getTableClient } from "../utils/tableStorage.js";
import { corsWrapper } from "../utils/cors.js";

app.http("triggerActions", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: corsWrapper(async (request, context) => {
    const { accessToken } = await verifyAuth(request.headers.get("cookie"));

    const body = await request.json();
    const { env, workflow_id, ref = "main", type, owner, repo } = body;
    const installationClient = getTableClient({ tableName: "installations" });
    const { installationId } = await installationClient.getEntity("account", `${type}:${owner}`);

    const githubApp = new App({
      appId: process.env.GITHUB_APP_ID,
      privateKey: Buffer.from(process.env.GITHUB_APP_PRIVATE_KEY, "base64").toString("utf8"),
    });
    const octokit = await githubApp.getInstallationOctokit(installationId);
    await octokit.request(`POST /repos/${owner}/${repo}/actions/workflows/${workflow_id}/dispatches`, { inputs: { env }, ref });
    return {
      jsonBody: { success: true },
    };
  }),
});
