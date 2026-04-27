import { app } from "@azure/functions";
import { App } from "octokit";
import { TableClient } from "@azure/data-tables";
import jwt from "jsonwebtoken";

app.http("callback", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    const {
      OAUTH_CLIENT_ID: clientId,
      OAUTH_SECRET: clientSecret,
      JWT_SECRET: jwtSecret,
      AZURE_STORAGE_CONNECTION_STRING: storageConnectionString,
    } = process.env;

    const code = request.query.get("code");

    if (!code) {
      return {
        status: 400,
        body: "Missing code",
      };
    }

    const returnUrl = request.query.get("state") ? decodeURIComponent(request.query.get("state")) : null;
    const allowedOrigin = getAllowedOrigin(returnUrl);
    if (!allowedOrigin) {
      return {
        status: 400,
        body: "Invalid returnUrl",
      };
    }

    const tableClient = TableClient.fromConnectionString(storageConnectionString, "tokens");

    // exchange code for access token
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    if (!accessToken) {
      return {
        status: 400,
        body: "Failed to get access token",
      };
    }

    // get user info
    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
      },
    });
    const user = await userRes.json();

    // // get orgs
    // const orgRes = await fetch("https://api.github.com/user/orgs", {
    //   headers: {
    //     Authorization: `Bearer ${accessToken}`,
    //   },
    // });
    // const orgs = await orgRes.json();

    const encryptedToken = accessToken; // TODO: need to encrypt the token before saving
    // save to table storage
    await tableClient.upsertEntity({
      partitionKey: user.id.toString(),
      rowKey: user.login,
      login: user.login,
      accessToken: encryptedToken,
    });
    console.log("✅Saved access token to Azure Table Storage for user:", user.login);
    const token = jwt.sign(
      {
        id: user.id,
        login: user.login,
      },
      jwtSecret,
    );

    return {
      status: 302,
      headers: {
        "Set-Cookie": `github_session=${token}; Path=/; HttpOnly; Secure; SameSite=None`, // TODO: consider setting SameSite to Lax or Strict in production for better security
        Location: allowedOrigin,
      },
    };
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
    return origin;
  }

  return "";
}
