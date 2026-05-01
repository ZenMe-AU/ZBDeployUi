import { app } from "@azure/functions";
import { App } from "octokit";
import { getAllowedOrigin } from "../utils/cors.js";

app.http("logout", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    const returnUrl = request.query.get("returnUrl") ? decodeURIComponent(request.query.get("returnUrl")) : null;
    const allowedOrigin = getAllowedOrigin(returnUrl);
    if (!allowedOrigin) {
      return {
        status: 400,
        body: "Invalid returnUrl",
      };
    }
    return {
      status: 302,
      headers: {
        "Set-Cookie": "github_session=; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=0",
        Location: allowedOrigin,
      },
    };
  },
});
