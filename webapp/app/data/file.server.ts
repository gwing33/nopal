import {
  S3Client,
  PutObjectCommand,
  ObjectCannedACL,
} from "@aws-sdk/client-s3";
import type { S3ClientConfig } from "@aws-sdk/client-s3";

// S3_ENDPOINT        – full endpoint URL for the S3 client
//                      local:  http://minio:9000  (internal Docker service name)
//                      prod:   https://fly.storage.tigris.dev
//
// S3_PUBLIC_HOSTNAME – hostname (+ optional port) used to build public file URLs
//                      local:  localhost:9000      (reachable from the browser)
//                      prod:   fly.storage.tigris.dev
//
// S3_FORCE_PATH_STYLE – set to "true" for MinIO; omit or set "false" for Tigris
//                       controls both the S3 client addressing style and the
//                       shape of the returned public URL

const AWS_REGION = "auto";

function getPublicFileUrl(filename: string): string {
  const hostname = process.env.S3_PUBLIC_HOSTNAME!;
  const bucket = process.env.BUCKET_NAME!;
  const forcePathStyle = process.env.S3_FORCE_PATH_STYLE === "true";

  if (forcePathStyle) {
    // Path-style: http(s)://hostname/bucket/filename
    const protocol =
      hostname.startsWith("localhost") || hostname.startsWith("127.")
        ? "http"
        : "https";
    return `${protocol}://${hostname}/${bucket}/${filename}`;
  }

  // Virtual-hosted style: https://bucket.hostname/filename  (Tigris default)
  return `https://${bucket}.${hostname}/${filename}`;
}

function createS3Client(): S3Client {
  return new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: AWS_REGION,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  } as S3ClientConfig);
}

export async function downloadAndUploadToS3(
  fileUrl: string,
  filename: string,
): Promise<string> {
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

export async function uploadPublicFileToS3(
  file: Buffer,
  filename: string,
): Promise<string> {
  const client = createS3Client();

  const putCommand = new PutObjectCommand({
    Bucket: process.env.BUCKET_NAME,
    Key: filename,
    Body: file,
    ACL: ObjectCannedACL.public_read,
    ContentType: getFileContentType(filename),
  });

  try {
    await client.send(putCommand);
    return getPublicFileUrl(filename);
  } catch (err) {
    console.error("Error uploading file:", err);
    throw err;
  }
}

export function getFileContentType(filename: string): string {
  const extension = filename.toLowerCase().split(".").pop();
  switch (extension) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "svg":
      return "image/svg+xml";
    case "webp":
      return "image/webp";
    case "bmp":
      return "image/bmp";
    case "ico":
      return "image/x-icon";
    case "tiff":
      return "image/tiff";
    case "pdf":
      return "application/pdf";
    case "h264":
      return "video/h264";
    default:
      return "application/octet-stream";
  }
}
