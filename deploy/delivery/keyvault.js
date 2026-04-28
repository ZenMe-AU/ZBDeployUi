import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

export async function updateKeyVaultSecrets(vaultName, secrets) {
  const url = `https://${vaultName}.vault.azure.net`;

  const credential = new DefaultAzureCredential();
  const client = new SecretClient(url, credential);

  for (const [name, value] of Object.entries(secrets)) {
    if (!value) {
      console.warn(`Skip empty secret: ${name}`);
      continue;
    }

    await client.setSecret(name, value);
    console.log(`Updated: ${name}`);
  }
}
