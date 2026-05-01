import { app } from "@azure/functions";
import { getAllowedOrigin } from "../utils/cors.js";

app.http("login", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    const returnUrl = request.query.get("returnUrl");
    if (!returnUrl) {
      return { status: 400, jsonBody: { error: "missing returnUrl" } };
    }
    const allowedOrigin = getAllowedOrigin(returnUrl);
    if (!allowedOrigin) {
      return { status: 400, jsonBody: { error: "host not allowed" } };
    }
    const state = encodeURIComponent(returnUrl);

    // const protocol = request.headers.get("x-forwarded-proto") || "https";

    let protocol = "https";
    try {
      protocol = request.headers.get("x-forwarded-proto")?.split(",")[0] || new URL(request.url).protocol.replace(":", "");
    } catch (err) {
      return { status: 500, jsonBody: { error: err.message } };
    }
    const host = request.headers.get("host");
    const redirectHost = `${protocol}://${host}`;
    const { OAUTH_CLIENT_ID: clientId } = process.env;
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
