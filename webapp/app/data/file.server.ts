import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ObjectCannedACL,
} from "@aws-sdk/client-s3";
import type { S3ClientConfig } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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

/**
 * Generate a short-lived presigned PUT URL so the browser can upload a file
 * directly to S3 without routing the bytes through the server.
 *
 * @param filename  The S3 key (e.g. "daily-log/user123/1234567890-video.mp4")
 * @param contentType  MIME type of the file being uploaded
 * @param expiresIn  Seconds until the URL expires (default: 300 = 5 minutes)
 * @returns { presignedUrl, publicUrl }
 */
export async function getPresignedUploadUrl(
  filename: string,
  contentType: string,
  expiresIn = 300,
): Promise<{ presignedUrl: string; publicUrl: string }> {
  const client = createS3Client();

  const putCommand = new PutObjectCommand({
    Bucket: process.env.BUCKET_NAME,
    Key: filename,
    ContentType: contentType,
    ACL: ObjectCannedACL.public_read,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const presignedUrl = await getSignedUrl(client as any, putCommand, {
    expiresIn,
  });
  const publicUrl = getPublicFileUrl(filename);

  return { presignedUrl, publicUrl };
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

export async function deleteFromS3(key: string): Promise<void> {
  const client = createS3Client();
  const deleteCommand = new DeleteObjectCommand({
    Bucket: process.env.BUCKET_NAME,
    Key: key,
  });
  try {
    await client.send(deleteCommand);
  } catch (err) {
    console.error("Error deleting file from S3:", err);
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
