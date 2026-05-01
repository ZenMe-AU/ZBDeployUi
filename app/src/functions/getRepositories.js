import { app } from "@azure/functions";
import { App } from "octokit";
import { verifyAuth } from "../utils/auth.js";

app.http("getRepositories", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    try {
      const { accessToken } = await verifyAuth(request.headers.get("cookie"));

      // get  repos
      const repos = await fetch("https://api.github.com/user/repos", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }).then((r) => r.json());
      console.log("👀user Repos", repos);
      const repoList = repos.map((repo) => ({ name: repo.name, id: repo.id, full_name: repo.full_name }));
      console.log("User orgs", repoList);
      const allowedOrigin = getAllowedOrigin(request.headers.get("origin"));
      return {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": allowedOrigin,
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
        jsonBody: { success: true, repoList },
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
