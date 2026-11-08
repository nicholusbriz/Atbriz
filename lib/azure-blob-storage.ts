import {
  BlobSASPermissions,
  BlobServiceClient,
  SASProtocol,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
} from '@azure/storage-blob';

const SAS_LIFETIME_MINUTES = 5;

function getStorageConfig() {
  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME?.trim();
  const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME?.trim();
  const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY?.trim();

  if (!accountName || !containerName || !accountKey) {
    throw new Error(
      'AZURE_STORAGE_ACCOUNT_NAME, AZURE_STORAGE_CONTAINER_NAME, and AZURE_STORAGE_ACCOUNT_KEY are required',
    );
  }

  const credential = new StorageSharedKeyCredential(accountName, accountKey);
  const serviceClient = new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    credential,
  );

  return {
    containerName,
    credential,
    containerClient: serviceClient.getContainerClient(containerName),
  };
}

export async function createBlobUploadUrl(blobName: string, contentType: string) {
  const { containerName, credential, containerClient } = getStorageConfig();
  const startsOn = new Date(Date.now() - 60_000);
  const expiresOn = new Date(Date.now() + SAS_LIFETIME_MINUTES * 60_000);
  const sas = generateBlobSASQueryParameters(
    {
      containerName,
      blobName,
      permissions: BlobSASPermissions.parse('cw'),
      protocol: SASProtocol.Https,
      startsOn,
      expiresOn,
      contentType,
    },
    credential,
  ).toString();

  return {
    blobName,
    uploadUrl: `${containerClient.getBlockBlobClient(blobName).url}?${sas}`,
  };
}

export function getBlobContainerClient() {
  return getStorageConfig().containerClient;
}
