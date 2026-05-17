/**
 * Shared Vault types.
 *
 * This file has NO server-only imports so it is safe to import from both
 * route loaders (server) and React components (client).
 */

export type MdVersion = {
  content: string;
  date: string; // YYYY-MM-DD
};

export type FileRef = {
  id: { tb: string; id: string };
  _id: string;
  human_id: string;
  name: string;
  s3_url: string | null;
  s3_key: string | null;
  content: string | null;
  md_versions: MdVersion[];
  content_type: string;
  folder_id: string | null;
  size: number | null;
  /** Set when the file was uploaded from the Daily Log. */
  source?: "daily_log";
  created_at: string;
  updated_at: string;
};

export type VaultFolder = {
  id: { tb: string; id: string };
  _id: string;
  human_id: string;
  name: string;
  parent_folder_id: string | null;
  shared_with: string[] | "everyone";
  created_at: string;
  updated_at: string;
};
