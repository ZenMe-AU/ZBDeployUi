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

    const body = await request.json();
    console.log("👍body", body);
    const { isPrivate = true, includeAllBranch = false, owner, type, repo = template_repo } = body;

    const octokit = new Octokit({
      auth: accessToken,
    });
    const { data } = await octokit.request(`POST /repos/{template_owner}/{template_repo}/generate`, {
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
    const result = { name: data.name, id: data.id, full_name: data.full_name };
    return {
      jsonBody: { success: true, data: result },
    };
  }),
});
