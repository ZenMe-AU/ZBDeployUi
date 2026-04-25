import { app } from "@azure/functions";
import { App } from "octokit";

app.http("login", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    const returnUrl = request.query.get("returnUrl");
    if (!returnUrl) {
      return { status: 400, jsonBody: { error: "missing returnUrl" } };
    }
    const allowList = (process.env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim());
    const returnUrlObj = new URL(returnUrl);
    if (!allowList.includes(returnUrlObj.origin)) {
      return { status: 400, jsonBody: { error: "host not allowed" } };
    }
    const state = encodeURIComponent(returnUrl);

    const protocol = request.headers.get("x-forwarded-proto") || "https";
    const host = request.headers.get("host");
    const redirectHost = `${protocol}://${host}`;
    const { GITHUB_CLIENT_ID: clientId } = process.env;
    const redirectUri = `${redirectHost}/callback`;
    const scope = "read:user read:org repo"; //repo
    const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;
    return {
      status: 302,
      headers: {
        Location: url,
      },
    };
  },
});
