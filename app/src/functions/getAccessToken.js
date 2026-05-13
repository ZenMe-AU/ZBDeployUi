import { app } from "@azure/functions";
import { corsWrapper } from "../utils/cors.js";
import { MissingParam, Forbidden } from "../error/index.js";

app.http("getAccessToken", {
  methods: ["POST", "OPTIONS"],
  authLevel: "anonymous",
  handler: corsWrapper(async (request, context) => {
    const body = await request.json();
    const { code, code_verifier, client_id } = body;

    if (!code || !code_verifier || !client_id) {
      throw MissingParam();
    }

    // exchange code for access token
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: client_id,
        code,
        code_verifier: code_verifier,
        client_secret: process.env.OAUTH_SECRET,
      }),
    });

    const data = await tokenRes.json();
    if (data.error) {
      // context.error("Error fetching access token:", data);
      throw Forbidden({
        meta: { reason: data.error, ...data },
      });
    }
    return {
      jsonBody: data,
    };
  }),
});
