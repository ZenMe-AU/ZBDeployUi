import { app } from "@azure/functions";
import { App } from "octokit";
import { getTableClient } from "../utils/tableStorage.js";

app.http("installCallback", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    const installationId = request.query.get("installation_id");
    const setupAction = request.query.get("setup_action");
    const state = request.query.get("state");
    console.log("Received callback with installationId:", installationId, "setupAction:", setupAction, "state:", state);

    if (!installationId) {
      return {
        status: 400,
        jsonBody: { error: "missing installation_id" },
      };
    }
    if (setupAction === "install") {
      const githubApp = new App({
        appId: process.env.GITHUB_APP_ID,
        privateKey: Buffer.from(process.env.GITHUB_APP_PRIVATE_KEY, "base64").toString("utf8"),
      });
      const octokit = await githubApp.getInstallationOctokit(installationId);
      const { data } = await octokit.request("GET /app/installations/{installation_id}", {
        installation_id: installationId,
      });
      console.log("👍data", data);

      const tokensClient = getTableClient({ tableName: "tokens" });
      const installationsClient = getTableClient({ tableName: "installations" });
      await installationsClient.upsertEntity({
        partitionKey: "account",
        rowKey: `${data.account.type}:${data.account.login}`,
        installationId: data.id,
        login: data.account.login,
        type: data.account.type,
        accountId: data.account.id,
      });
      console.log("✅Saved access token to Azure Table Storage for installation:", installationId);
    }

    return {
      status: 200,
      jsonBody: {
        success: true,
      },
    };
  },
});
