import { AzureBlobStorageProvider } from "./AzureBlobStorageProvider";
import { StorageProvider } from "./StorageProvider";

export function createStorageProvider(): StorageProvider {
  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  const containerName = process.env.AZURE_STORAGE_CONTAINER ?? "app-files";
  const useManagedIdentity = process.env.AZURE_STORAGE_USE_MANAGED_IDENTITY === "true";
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;

  if (!accountName) {
    throw new Error("AZURE_STORAGE_ACCOUNT_NAME is required");
  }

  return new AzureBlobStorageProvider({
    accountName,
    containerName,
    useManagedIdentity,
    connectionString,
    accountKey,
  });
}

let sharedProvider: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (!sharedProvider) {
    sharedProvider = createStorageProvider();
  }
  return sharedProvider;
}

export function resetStorageProvider(): void {
  sharedProvider = null;
}
