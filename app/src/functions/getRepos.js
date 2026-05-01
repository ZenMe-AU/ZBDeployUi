import { app } from "@azure/functions";
import { App } from "octokit";
import { getTableClient } from "../utils/tableStorage.js";
import { verifyAuth } from "../utils/auth.js";
import { corsWrapper } from "../utils/cors.js";

app.http("getRepos", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: corsWrapper(async (request, context) => {
    const { accessToken } = await verifyAuth(request.headers.get("cookie"));

    const type = request.query.get("type");
    const owner = request.query.get("owner");

    const uri = type === "User" ? "https://api.github.com/user/repos" : `https://api.github.com/orgs/${owner}/repos`;
    console.log("Fetching repos from URI:", uri);
    // get  repos
    const repos = await fetch(uri, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }).then((r) => r.json());
    console.log("👀user Repos", repos);
    const repoList = repos.filter((repo) => repo.owner.type === type).map((repo) => ({ name: repo.name, id: repo.id, full_name: repo.full_name }));
    console.log("User orgs", repoList);
    return {
      jsonBody: { success: true, repoList },
    };
  }),
});
