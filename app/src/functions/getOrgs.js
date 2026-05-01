import { app } from "@azure/functions";
import { Octokit } from "octokit";
import { verifyAuth } from "../utils/auth.js";
import { getTableClient } from "../utils/tableStorage.js";
import { corsWrapper } from "../utils/cors.js";

app.http("getOrgs", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: corsWrapper(async (request, context) => {
    const { user, accessToken } = await verifyAuth(request.headers.get("cookie"));
    const { userId, login } = user;

    const octokit = new Octokit({
      auth: accessToken,
    });
    const { data } = await octokit.request(`GET /user/orgs`);
    const orgList = data.map((org) => ({ login: org.login, id: org.id }));
    return {
      jsonBody: { success: true, orgList, user: { login, id: userId } },
    };
  }),
});
