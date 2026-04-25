import { app } from "@azure/functions";
import { App } from "octokit";

app.http("login", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    const protocol = request.headers.get("x-forwarded-proto") || "https";
    const host = request.headers.get("host");
    const redirectHost = `${protocol}://${host}`;
    const { GITHUB_CLIENT_ID: clientId } = process.env;
    const redirectUri = `${redirectHost}/callback`;
    const scope = "read:user read:org repo"; //repo
    const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
    return {
      status: 302,
      headers: {
        Location: url,
      },
    };
  },
});
