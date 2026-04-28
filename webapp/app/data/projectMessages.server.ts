import { RecordId } from "surrealdb";
import { Data, query, formatRecord, upsert, remove } from "./generic.server";

export type ProjectMessage = Data & {
  projectId: string;
  humanId: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
  updatedAt: string;
};

export async function getMessagesByProjectId(
  projectId: string,
): Promise<ProjectMessage[]> {
  const result = await query<[ProjectMessage[]]>(
    `SELECT * FROM project_messages WHERE projectId = $projectId ORDER BY createdAt ASC;`,
    { projectId },
  );
  const records = result?.[0] ?? [];
  return records.map((r) => formatRecord(r));
}

export async function createMessage(data: {
  projectId: string;
  humanId: string;
  content: string;
  isInternal: boolean;
}): Promise<ProjectMessage | undefined> {
  const now = new Date().toISOString();
  const result = await upsert("project_messages", {
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  const record = Array.isArray(result) ? result[0] : result;
  return record ? formatRecord(record as unknown as ProjectMessage) : undefined;
}

export async function updateMessage(
  id: string,
  data: { content: string },
): Promise<ProjectMessage | undefined> {
  const existing = await query<[ProjectMessage[]]>(
    `SELECT * FROM project_messages WHERE id = $id;`,
    { id: new RecordId("project_messages", id) },
  );
  const record = existing?.[0]?.[0];
  if (!record) return undefined;

  const result = await upsert(new RecordId("project_messages", id), {
    ...record,
    content: data.content,
    updatedAt: new Date().toISOString(),
  });
  const updated = Array.isArray(result) ? result[0] : result;
  return updated
    ? formatRecord(updated as unknown as ProjectMessage)
    : undefined;
}

export async function deleteMessage(id: string): Promise<void> {
  await remove("project_messages", id);
}
