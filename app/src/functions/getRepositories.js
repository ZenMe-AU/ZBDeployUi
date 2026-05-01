import { app } from "@azure/functions";
import { App } from "octokit";
import { verifyAuth } from "../utils/auth.js";
import { corsWrapper } from "../utils/cors.js";

app.http("getRepositories", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: corsWrapper(async (request, context) => {
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
    return {
      jsonBody: { success: true, repoList },
    };
  }),
});
