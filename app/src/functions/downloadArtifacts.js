import { app } from "@azure/functions";
import { App } from "octokit";
import { getTableClient } from "../utils/tableStorage.js";
import { corsWrapper } from "../utils/cors.js";

app.http("downloadArtifacts", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: corsWrapper(async (request, context) => {
    const { accessToken } = await verifyAuth(request.headers.get("cookie"));

    const artifacts_id = request.query.get("artifacts_id");
    const type = request.query.get("type");
    const owner = request.query.get("owner");
    const repo = request.query.get("repo");
    const ref = request.query.get("ref") ?? "main";

    const installationClient = getTableClient({ tableName: "installations" });
    const { installationId } = await installationClient.getEntity("account", `${type}:${owner}`);

    const githubApp = new App({
      appId: process.env.GITHUB_APP_ID,
      privateKey: Buffer.from(process.env.GITHUB_APP_PRIVATE_KEY, "base64").toString("utf8"),
    });

    const octokit = await githubApp.getInstallationOctokit(installationId);
    const { data } = await octokit.request("GET /repos/{owner}/{repo}/actions/artifacts/{artifacts_id}/zip", {
      owner,
      repo,
      artifacts_id,
      ref,
    });
    const content = Buffer.from(data.content, "base64").toString("utf8");
    return {
      jsonBody: { success: true, content },
    };
  }),
});
