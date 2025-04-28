import {
  S3Client,
  PutObjectCommand,
  ObjectCannedACL,
} from "@aws-sdk/client-s3";
import type { S3ClientConfig } from "@aws-sdk/client-s3";

// No need to store these in .env as they aren't sensitive information
const TIGRIS_URL = "fly.storage.tigris.dev";
const AWS_ENDPOINT = "https://" + TIGRIS_URL;
const AWS_REGION = "auto";

export async function downloadAndUploadToS3(fileUrl: string, filename: string) {
  try {
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    return await uploadPublicFileToS3(buffer, filename);
  } catch (err) {
    console.error("Error downloading and uploading file:", err);
    throw err;
  }
}

export async function uploadPublicFileToS3(file: Buffer, filename: string) {
  const client = new S3Client({
    endpoint: AWS_ENDPOINT,
    region: AWS_REGION,
    credentials: {
      accessKeyId: process.env.WS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  } as S3ClientConfig);
  const putCommand = new PutObjectCommand({
    Bucket: process.env.BUCKET_NAME,
    Key: filename,
    Body: file,
    ACL: ObjectCannedACL.public_read,
  });

  try {
    await client.send(putCommand);
    return `https://${process.env.BUCKET_NAME}.${TIGRIS_URL}/${filename}`;
  } catch (err) {
    console.error("Error uploading file:", err);
    throw err;
  }
}
