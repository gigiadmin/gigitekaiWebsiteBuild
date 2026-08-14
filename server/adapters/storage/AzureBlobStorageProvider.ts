import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  BlockBlobClient,
  BlobClient,
  ContainerClient,
} from "@azure/storage-blob";
import { DefaultAzureCredential } from "@azure/identity";
import type { Readable } from "stream";
import {
  StorageProvider,
  PutObjectInput,
  PutObjectResult,
  HeadObjectResult,
  normalizeStorageKey,
} from "./StorageProvider";

export interface AzureBlobStorageConfig {
  accountName: string;
  containerName: string;
  useManagedIdentity?: boolean;
  connectionString?: string;
  accountKey?: string;
  endpointProtocol?: string;
}

export class AzureBlobStorageProvider implements StorageProvider {
  private containerClient: ContainerClient;
  private accountName: string;
  private accountKey?: string;

  constructor(private config: AzureBlobStorageConfig) {
    this.accountName = config.accountName;
    let blobServiceClient: BlobServiceClient;

    if (config.useManagedIdentity && !config.connectionString && !config.accountKey) {
      const endpoint = `https://${config.accountName}.blob.core.windows.net`;
      blobServiceClient = new BlobServiceClient(endpoint, new DefaultAzureCredential());
    } else if (config.connectionString) {
      blobServiceClient = BlobServiceClient.fromConnectionString(config.connectionString);
    } else if (config.accountKey) {
      const credential = new StorageSharedKeyCredential(config.accountName, config.accountKey);
      const endpoint = `https://${config.accountName}.blob.core.windows.net`;
      blobServiceClient = new BlobServiceClient(endpoint, credential);
      this.accountKey = config.accountKey;
    } else {
      throw new Error(
        "Azure Blob config requires either useManagedIdentity, connectionString, or accountKey"
      );
    }

    this.containerClient = blobServiceClient.getContainerClient(config.containerName);
  }

  async ensureContainerExists(): Promise<void> {
    await this.containerClient.createIfNotExists({ access: "blob" });
  }

  private getBlockBlobClient(key: string): BlockBlobClient {
    return this.containerClient.getBlockBlobClient(normalizeStorageKey(key));
  }

  async putObject(input: PutObjectInput): Promise<PutObjectResult> {
    const key = normalizeStorageKey(input.key);
    const blockBlob = this.getBlockBlobClient(key);
    const options = {
      blobHTTPHeaders: { blobContentType: input.contentType },
      metadata: input.metadata,
    };

    let uploadPromise: Promise<unknown>;
    if (Buffer.isBuffer(input.body)) {
      uploadPromise = blockBlob.upload(input.body, input.body.length, options);
    } else if (input.body instanceof Readable) {
      uploadPromise = blockBlob.uploadStream(input.body as unknown as NodeJS.ReadableStream, undefined, undefined, options);
    } else if (typeof input.body === "string") {
      const buf = Buffer.from(input.body, "utf-8");
      uploadPromise = blockBlob.upload(buf, buf.length, options);
    } else if (input.body instanceof Uint8Array) {
      const buf = Buffer.from(input.body);
      uploadPromise = blockBlob.upload(buf, buf.length, options);
    } else {
      throw new Error(`Unsupported body type for Azure Blob putObject: ${typeof input.body}`);
    }

    await uploadPromise;
    return { key };
  }

  async getSignedReadUrl(key: string, expiresInSeconds: number): Promise<string> {
    const blobClient = this.getBlockBlobClient(key);

    if (this.accountKey) {
      const sas = generateBlobSASQueryParameters(
        {
          containerName: this.config.containerName,
          blobName: normalizeStorageKey(key),
          permissions: BlobSASPermissions.parse("r"),
          startsOn: new Date(Date.now() - 60 * 1000),
          expiresOn: new Date(Date.now() + expiresInSeconds * 1000),
        },
        new StorageSharedKeyCredential(this.accountName, this.accountKey)
      ).toString();
      return `${blobClient.url}?${sas}`;
    }

    // For managed identity / connection string, use User Delegation Key SAS
    const userDelegationKey = await blobClient
      .getContainerClient()
      .getBlobServiceClient()
      .getUserDelegationKey(
        new Date(Date.now() - 60 * 1000),
        new Date(Date.now() + expiresInSeconds * 1000)
      );
    const sas = generateBlobSASQueryParameters(
      {
        containerName: this.config.containerName,
        blobName: normalizeStorageKey(key),
        permissions: BlobSASPermissions.parse("r"),
        startsOn: new Date(Date.now() - 60 * 1000),
        expiresOn: new Date(Date.now() + expiresInSeconds * 1000),
      },
      userDelegationKey,
      this.accountName
    ).toString();
    return `${blobClient.url}?${sas}`;
  }

  async deleteObject(key: string): Promise<void> {
    await this.getBlockBlobClient(key).deleteIfExists();
  }

  async headObject(key: string): Promise<HeadObjectResult | null> {
    try {
      const props = await this.getBlockBlobClient(key).getProperties();
      return {
        size: props.contentLength ?? 0,
        contentType: props.contentType,
        etag: props.etag,
        metadata: props.metadata,
      };
    } catch (err: any) {
      if (err.statusCode === 404) return null;
      throw err;
    }
  }

  async getPublicReadUrl(key: string): Promise<string> {
    return this.getBlockBlobClient(key).url;
  }
}
