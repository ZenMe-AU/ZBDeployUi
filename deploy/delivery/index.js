import { updateKeyVaultSecrets } from "./keyvault.js";
import { buildFunctionApp, zipFunctionApp, deployFunctionAppZip, deleteAppSetting } from "./functionApp.js";
import { execSync } from "child_process";
import { exit } from "process";

function getCurrentSubscription() {
  return execSync(`az account show --query id -o tsv`, { encoding: "utf8" }).trim();
}

function switchSubscription(subscriptionId) {
  console.log(`Switching to subscription: ${subscriptionId}`);
  execSync(`az account set --subscription ${subscriptionId}`, { stdio: "inherit" });
}

export async function runDeploy(config) {
  const { subscriptionId, vaultName, secretList, functionAppName, resourceGroupName, appCwd } = config;

  try {
    console.log("Step 0: Check subscription");
    const currentSub = getCurrentSubscription();
    if (subscriptionId && currentSub !== subscriptionId) {
      console.log("Current subscription:", currentSub);
      switchSubscription(subscriptionId);
    }

    console.log("Step 1: Update Key Vault");
    await updateKeyVaultSecrets(vaultName, secretList);

    console.log("Step 2: Copy files");
    const outputDirName = "dist";
    const distCwd = `${appCwd}/${outputDirName}`;
    execSync(`rm -rf ${outputDirName}`, { stdio: "inherit", shell: true, cwd: appCwd });
    execSync(
      `
      rsync -av --delete \
        --include="src/***" \
        --include="host.json" \
        --include="package.json" \
        --exclude="*" \
        ./ ${outputDirName}/
      `,
      { stdio: "inherit", shell: true, cwd: appCwd },
    );

    console.log("Step 3: Install production dependencies");
    execSync(`npm install --omit=dev`, { stdio: "inherit", shell: true, cwd: distCwd });

    console.log("Step 4: Zip");
    const zipName = "deploy.zip";
    zipFunctionApp({ outputName: zipName }, { cwd: distCwd });

    console.log("Step 5: Delete old app settings");
    deleteAppSetting({ functionAppName, resourceGroupName, settingName: "AzureWebJobsStorage" });

    console.log("Step 6: Deploy");
    deployFunctionAppZip(
      {
        src: zipName,
        functionAppName,
        resourceGroupName,
      },
      { cwd: distCwd },
    );

    console.log("Deploy success");
  } catch (err) {
    console.error("Deploy failed:", err);
    throw err;
  }
}
