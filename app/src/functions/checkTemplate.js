import { app } from "@azure/functions";
import { App } from "octokit";
import { verifyAuth } from "../utils/auth.js";

const templateOwner = "ZenMe-AU";
app.http("checkTemplate", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    try {
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
      const allowedOrigin = getAllowedOrigin(request.headers.get("origin"));
      return {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": allowedOrigin,
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
        jsonBody: { success: true, isTemplate, templateName },
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
