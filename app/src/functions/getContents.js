import { app } from "@azure/functions";
import { Octokit } from "octokit";
import { getTableClient } from "../utils/tableStorage.js";
import { verifyAuth } from "../utils/auth.js";
import { corsWrapper } from "../utils/cors.js";

app.http("getContents", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: corsWrapper(async (request, context) => {
    const { accessToken } = await verifyAuth(request.headers.get("cookie"));
    const path = request.query.get("path");
    const type = request.query.get("type");
    const owner = request.query.get("owner");
    const repo = request.query.get("repo");
    const ref = request.query.get("ref") ?? "main";

    const octokit = new Octokit({
      auth: accessToken,
    });
    const { data } = await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
      owner,
      repo,
      path,
      ref,
    });
    const content = Buffer.from(data.content, "base64").toString("utf8");
    return {
      jsonBody: { success: true, content },
    };
  }),
});
