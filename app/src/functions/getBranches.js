import { app } from "@azure/functions";
import { Octokit } from "octokit";
import { verifyAuth } from "../utils/auth.js";
import { getTableClient } from "../utils/tableStorage.js";
import { corsWrapper } from "../utils/cors.js";

app.http("getBranches", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: corsWrapper(async (request, context) => {
    const { accessToken } = await verifyAuth(request.headers.get("cookie"));

    const octokit = new Octokit({ auth: accessToken });
    const owner = request.query.get("owner");
    const repo = request.query.get("repo");
    // const type = request.query.get("type");

    const { data } = await octokit.request(`GET /repos/{owner}/{repo}/branches`, { owner, repo });
    const branchList = data.map((branch) => ({ name: branch.name, commit: branch.commit.sha, protected: branch.protected }));
    return {
      jsonBody: { success: true, branches: branchList },
    };
  }),
});
