import { app } from "@azure/functions";
import { App } from "octokit";
import { TableClient } from "@azure/data-tables";
import { DefaultAzureCredential } from "@azure/identity";
import jwt from "jsonwebtoken";
import { log } from "console";

const templateOwner = "ZenMe-AU";
app.http("checkTemplate", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    try {
      const cookie = request.headers.get("cookie");
      const token = parseCookie(cookie)?.github_session;
      if (!token) {
        return { status: 401, jsonBody: { loggedIn: false } };
      }
      const { id: userId, login } = await authenticateJWT(token);
      const credential = new DefaultAzureCredential();
      const storageAccountName = process.env.STORAGE_ACCOUNT_TABLE_NAME;
      const tokensClient = new TableClient(`https://${storageAccountName}.table.core.windows.net`, "tokens", credential);
      const { accessToken } = await tokensClient.getEntity(String(userId), login); // TODO: need to decrypt access token

      const type = request.query.get("type");
      const owner = request.query.get("owner");
      const repo = request.query.get("repo");

      const uri = `https://api.github.com/repos/${owner}/${repo}`;
      console.log("Fetching repo details from URI:", uri);
      // get repo details
      const repoDetail = await fetch(uri, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }).then((r) => r.json());
      console.log("👀user Repos", repoDetail);

      const isTemplate = repoDetail.template_repository && repoDetail.template_repository.owner.login === templateOwner ? true : false;
      const templateName = isTemplate ? repoDetail.template_repository.full_name : undefined;
      const allowedOrigin = getAllowedOrigin(request.headers.get("origin"));
      return {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": allowedOrigin,
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
        jsonBody: { success: true, isTemplate, templateName },
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

function parseCookie(cookieHeader = "") {
  return Object.fromEntries(
    cookieHeader
      .split("; ")
      .filter(Boolean)
      .map((v) => {
        const [key, ...rest] = v.split("=");
        return [key, rest.join("=")];
      }),
  );
}

function authenticateJWT(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return reject(new Error("Invalid token"));

      console.log("🛄 Decoded JWT", decoded);
      resolve(decoded);
    });
  });
}

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
