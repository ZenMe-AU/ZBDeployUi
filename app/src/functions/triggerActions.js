import { app } from "@azure/functions";
import { App } from "octokit";
import { TableClient } from "@azure/data-tables";
import { DefaultAzureCredential } from "@azure/identity";

app.http("triggerActions", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    try {
      const cookie = request.headers.get("cookie");
      const token = parseCookie(cookie)?.github_session;
      if (!token) {
        return { status: 401, jsonBody: { loggedIn: false } };
      }
      const { id: userId, login } = await authenticateJWT(token);
      console.log("Authenticated user", { userId, login });
      const credential = new DefaultAzureCredential();
      const storageAccountName = process.env.STORAGE_ACCOUNT_TABLE_NAME;
      const tokensClient = new TableClient(`https://${storageAccountName}.table.core.windows.net`, "tokens", credential);
      const { accessToken } = await tokensClient.getEntity(String(userId), login); // TODO: need to decrypt access token

      const body = await request.json();
      const { env, workflow_id, ref = "main", type, owner, repo } = body;
      const installationClient = new TableClient(`https://${storageAccountName}.table.core.windows.net`, "installations", credential);
      const { installationId } = await installationClient.getEntity("account", `${type}:${owner}`);

      const githubApp = new App({
        appId: process.env.GITHUB_APP_ID,
        privateKey: Buffer.from(process.env.GITHUB_APP_PRIVATE_KEY, "base64").toString("utf8"),
      });
      const octokit = await githubApp.getInstallationOctokit(installationId);
      await octokit.request(`POST /repos/${owner}/${repo}/actions/workflows/${workflow_id}/dispatches`, { inputs: { env }, ref });
      const allowedOrigin = getAllowedOrigin(request.headers.get("origin"));
      return {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": allowedOrigin,
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
        jsonBody: { success: true },
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
