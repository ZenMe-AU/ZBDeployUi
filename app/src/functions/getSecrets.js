import { app } from "@azure/functions";
import { Octokit } from "octokit";
import { verifyAuth } from "../utils/auth.js";
import { corsWrapper } from "../utils/cors.js";

app.http("getSecrets", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: corsWrapper(async (request, context) => {
    const { accessToken } = await verifyAuth(request.headers.get("cookie"));
    const owner = request.query.get("owner");
    const repo = request.query.get("repo");

    const octokit = new Octokit({ auth: accessToken });
    const { data } = await octokit.request("GET /repos/{owner}/{repo}/actions/secrets", { owner, repo });
    const secretList = data.secrets.map(({ name }) => name);
    return {
      jsonBody: { success: true, secrets: secretList },
    };
  }),
});
