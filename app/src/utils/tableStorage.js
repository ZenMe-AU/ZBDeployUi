import { DefaultAzureCredential } from "@azure/identity";
import { TableClient } from "@azure/data-tables";

const credential = new DefaultAzureCredential();
const defaultStorageAccountName = process.env.STORAGE_ACCOUNT_TABLE_NAME;

// cache: key = `${account}:${table}`
const tableClientCache = new Map();

export function getTableClient({ storageAccountName = defaultStorageAccountName, tableName }) {
  const key = `${storageAccountName}:${tableName}`;

  if (!tableClientCache.has(key)) {
    const client = new TableClient(`https://${storageAccountName}.table.core.windows.net`, tableName, credential);

    tableClientCache.set(key, client);
  }

  return tableClientCache.get(key);
}

export async function getEntity(tableClient, partitionKey, rowKey) {
  return tableClient.getEntity(partitionKey, rowKey);
}
