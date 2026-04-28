import type { EndpointProps } from "./docs.types";

export const uploadPost = {
  method: "POST",
  path: "/api/upload",
  summary: "Upload a file to S3",
  description:
    "Uploads a single file and returns its public URL. Files are stored under the authenticated user's folder in S3 and are publicly readable. Currently used for daily-log attachments.",
  contentType: "multipart/form-data",
  requestBody: [
    {
      name: "file",
      type: "File",
      required: true,
      description:
        "The file to upload. Any content type is accepted. The filename is sanitized — characters outside a–z, A–Z, 0–9, ., _, and - are replaced with underscores.",
    },
  ],
  responseExample: `HTTP 200 OK
{ "url": "https://<bucket>.s3.amazonaws.com/daily-log/<userId>/<timestamp>-<filename>" }

// Errors
HTTP 400  { "error": "No file provided" }
HTTP 401  { "error": "Not authenticated" }
HTTP 500  { "error": "<message from S3>" }`,
  notes: [
    "The file is stored at the path daily-log/{userId}/{timestamp}-{safeName} inside the configured S3 bucket.",
    "The returned URL is public and permanent — there is no expiry.",
    "There is no enforced file-size limit at the API layer; S3 limits apply.",
    "Only POST is supported. GET, PUT, and DELETE return 405.",
  ],
} satisfies EndpointProps;
