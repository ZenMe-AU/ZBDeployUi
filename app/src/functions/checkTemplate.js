import { app } from "@azure/functions";
import { App } from "octokit";
import { verifyAuth } from "../utils/auth.js";
import { corsWrapper } from "../utils/cors.js";

const templateOwner = "ZenMe-AU";
app.http("checkTemplate", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: corsWrapper(async (request, context) => {
    const { accessToken } = await verifyAuth(request.headers.get("cookie"));

    const type = request.query.get("type");
    const owner = request.query.get("owner");
    const repo = request.query.get("repo");

    const uri = `https://api.github.com/repos/${owner}/${repo}`;
    console.log("Fetching repo details from URI:", uri);
    // get repo details
    const repoDetail = await fetch(uri, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }).then((r) => r.json());
    console.log("👀user Repos", repoDetail);

    const isTemplate = repoDetail.template_repository && repoDetail.template_repository.owner.login === templateOwner ? true : false;
    const templateName = isTemplate ? repoDetail.template_repository.full_name : undefined;
    return {
      jsonBody: { success: true, isTemplate, templateName },
    };
  }),
});
