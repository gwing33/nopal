import { RecordId } from "surrealdb";
import { query, formatRecord, upsert, remove, merge } from "./generic.server";
import { deleteFromS3 } from "./file.server";

// ─── Types (defined in vault.types.ts; re-exported from here for convenience) ──
export type { MdVersion, FileRef, VaultFolder } from "./vault.types";
import type { MdVersion, FileRef, VaultFolder } from "./vault.types";

// ─── FileRef CRUD ─────────────────────────────────────────────────────────────

export async function createFileRef(data: {
  human_id: string;
  name: string;
  s3_url?: string | null;
  s3_key?: string | null;
  content?: string | null;
  content_type: string;
  folder_id?: string | null;
  size?: number | null;
  source?: "daily_log";
}): Promise<FileRef | undefined> {
  const now = new Date().toISOString();
  const result = await upsert("file_refs", {
    human_id: data.human_id,
    name: data.name,
    s3_url: data.s3_url ?? null,
    s3_key: data.s3_key ?? null,
    content: data.content ?? null,
    md_versions: [],
    content_type: data.content_type,
    folder_id: data.folder_id ?? null,
    size: data.size ?? null,
    ...(data.source ? { source: data.source } : {}),
    created_at: now,
    updated_at: now,
  });
  const record = Array.isArray(result) ? result[0] : result;
  return record ? formatRecord(record as unknown as FileRef) : undefined;
}

export async function getFileRefsByHuman(humanId: string): Promise<FileRef[]> {
  const result = await query<[FileRef[]]>(
    `SELECT * FROM file_refs WHERE human_id = $humanId ORDER BY created_at DESC`,
    { humanId },
  );
  return (result?.[0] ?? []).map(formatRecord);
}

export async function getFileRefsByFolderIds(
  folderIds: string[],
): Promise<FileRef[]> {
  if (!folderIds.length) return [];
  const result = await query<[FileRef[]]>(
    `SELECT * FROM file_refs WHERE folder_id IN $folderIds ORDER BY created_at DESC`,
    { folderIds },
  );
  return (result?.[0] ?? []).map(formatRecord);
}

export async function getFileRefById(id: string): Promise<FileRef | undefined> {
  const result = await query<[FileRef[]]>(
    `SELECT * FROM file_refs WHERE id = $rid`,
    { rid: new RecordId("file_refs", id) },
  );
  const record = result?.[0]?.[0];
  return record ? formatRecord(record) : undefined;
}

export async function updateFileRef(
  id: string,
  updates: Partial<{
    name: string;
    folder_id: string | null;
    content: string;
    md_versions: MdVersion[];
  }>,
): Promise<FileRef | undefined> {
  const result = await merge("file_refs", id, {
    ...(updates as Record<string, unknown>),
    updated_at: new Date().toISOString(),
  });
  return result ? formatRecord(result as unknown as FileRef) : undefined;
}

export async function deleteFileRef(id: string): Promise<void> {
  const file = await getFileRefById(id);
  if (file?.s3_key) {
    try {
      await deleteFromS3(file.s3_key);
    } catch (err) {
      console.error(`Failed to delete S3 object for file_ref ${id}:`, err);
      // Continue with DB deletion even if S3 fails
    }
  }
  await remove("file_refs", id);
}

// ─── VaultFolder CRUD ─────────────────────────────────────────────────────────

export async function createVaultFolder(data: {
  human_id: string;
  name: string;
  parent_folder_id?: string | null;
  shared_with?: string[] | "everyone";
}): Promise<VaultFolder | undefined> {
  const now = new Date().toISOString();
  const result = await upsert("vault_folders", {
    human_id: data.human_id,
    name: data.name,
    parent_folder_id: data.parent_folder_id ?? null,
    shared_with: data.shared_with ?? [],
    created_at: now,
    updated_at: now,
  });
  const record = Array.isArray(result) ? result[0] : result;
  return record ? formatRecord(record as unknown as VaultFolder) : undefined;
}

export async function getFoldersByHuman(
  humanId: string,
): Promise<VaultFolder[]> {
  const result = await query<[VaultFolder[]]>(
    `SELECT * FROM vault_folders WHERE human_id = $humanId ORDER BY name ASC`,
    { humanId },
  );
  return (result?.[0] ?? []).map(formatRecord);
}

export async function getFolderById(
  id: string,
): Promise<VaultFolder | undefined> {
  const result = await query<[VaultFolder[]]>(
    `SELECT * FROM vault_folders WHERE id = $rid`,
    { rid: new RecordId("vault_folders", id) },
  );
  const record = result?.[0]?.[0];
  return record ? formatRecord(record) : undefined;
}

export async function getSharedFoldersForHuman(
  humanId: string,
): Promise<VaultFolder[]> {
  const result = await query<[VaultFolder[]]>(
    `SELECT * FROM vault_folders
     WHERE human_id != $humanId
       AND (shared_with = 'everyone' OR $humanId IN shared_with)
     ORDER BY human_id, name ASC`,
    { humanId },
  );
  return (result?.[0] ?? []).map(formatRecord);
}

export async function updateVaultFolder(
  id: string,
  updates: Partial<{
    name: string;
    shared_with: string[] | "everyone";
  }>,
): Promise<VaultFolder | undefined> {
  const result = await merge("vault_folders", id, {
    ...(updates as Record<string, unknown>),
    updated_at: new Date().toISOString(),
  });
  return result ? formatRecord(result as unknown as VaultFolder) : undefined;
}

async function getAllNestedFolderIds(parentId: string): Promise<string[]> {
  const result = await query<[VaultFolder[]]>(
    `SELECT * FROM vault_folders WHERE parent_folder_id = $parentId`,
    { parentId },
  );
  const children = (result?.[0] ?? []).map(formatRecord);
  const ids: string[] = [];
  for (const child of children) {
    ids.push(child._id);
    const nested = await getAllNestedFolderIds(child._id);
    ids.push(...nested);
  }
  return ids;
}

/**
 * Find an existing folder matching (humanId + name + parentFolderId) or create it.
 * Useful for auto-provisioning the daily-logs folder tree.
 */
export async function getOrCreateVaultFolder(
  humanId: string,
  name: string,
  parentFolderId: string | null = null,
): Promise<VaultFolder> {
  const result = await query<[VaultFolder[]]>(
    `SELECT * FROM vault_folders
     WHERE human_id = $humanId
       AND name = $name
       AND parent_folder_id = $parentFolderId
     LIMIT 1`,
    { humanId, name, parentFolderId },
  );
  const existing = result?.[0]?.[0];
  if (existing) return formatRecord(existing);

  const created = await createVaultFolder({
    human_id: humanId,
    name,
    parent_folder_id: parentFolderId,
  });
  if (!created) throw new Error(`Failed to create vault folder: ${name}`);
  return created;
}

export async function deleteVaultFolderCascade(
  folderId: string,
): Promise<void> {
  const allFolderIds = await getAllNestedFolderIds(folderId);
  allFolderIds.push(folderId);

  for (const fid of allFolderIds) {
    const filesResult = await query<[FileRef[]]>(
      `SELECT * FROM file_refs WHERE folder_id = $fid`,
      { fid },
    );
    const files = (filesResult?.[0] ?? []).map(formatRecord);
    for (const file of files) {
      await deleteFileRef(file._id);
    }
  }

  for (const fid of allFolderIds) {
    await remove("vault_folders", fid);
  }
}

// ─── .md versioning helper ────────────────────────────────────────────────────

export function computeMdUpdate(
  file: FileRef,
  newContent: string,
): { content: string; md_versions: MdVersion[] } {
  const today = new Date().toISOString().slice(0, 10);
  const lastUpdatedDay = file.updated_at.slice(0, 10);

  if (lastUpdatedDay === today) {
    return { content: newContent, md_versions: file.md_versions ?? [] };
  }

  const newVersion: MdVersion = {
    content: file.content ?? "",
    date: lastUpdatedDay,
  };
  return {
    content: newContent,
    md_versions: [...(file.md_versions ?? []), newVersion],
  };
}
