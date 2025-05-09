import { RecordId } from "surrealdb";

import type {
  BlockObjectResponse,
  ListBlockChildrenResponse,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";
import { query, select, defineTable, upsert } from "../generic.server";
import type { Data } from "../generic.server";

// Nopal Notion Wrapper Types
export type NopalBlock = { blocks: BlockObjectResponse[] } & Data;
export type NopalPage = PageObjectResponse &
  Data & { pageDetails?: BlockObjectResponse[] };

// Connecting Notion Databases to locally stored DBs.
export type NotionDatabase = {
  id: string; // Notion DB ID
  dbName: string; // Local DB Name
};
const _dbs: NotionDatabase[] = [];
export function registerDb(db: NotionDatabase) {
  _dbs.push(db);
}
export function getDbByName(name: string): NotionDatabase | undefined {
  return _dbs.find((db) => db.dbName === name);
}
export function getAllDbs() {
  return _dbs;
}

// Store all pages in a single table
export const PAGE_TABLE_NAME = "notion_pages";
const BLOCK_TABLE_NAME = "notion_blocks";

export async function defineNotionTables() {
  await defineTable(PAGE_TABLE_NAME);
  await defineTable(BLOCK_TABLE_NAME);
  await query(
    `DEFINE FIELD IF NOT EXISTS pageDetails on ${PAGE_TABLE_NAME} TYPE record <${BLOCK_TABLE_NAME}>;`
  );
}
export async function definePageField(dbName: string) {
  return await query(
    `DEFINE FIELD IF NOT EXISTS page on ${dbName} TYPE record <${PAGE_TABLE_NAME}>;`
  );
}
export async function upsertPage(page: PageObjectResponse) {
  return upsert(PAGE_TABLE_NAME, page);
}
export async function upsertBlock(block: ListBlockChildrenResponse) {
  return upsert(BLOCK_TABLE_NAME, block);
}

export async function findAllNopalPagesByIds(ids: string[]) {
  return await query<NopalPage[]>("SELECT * FROM $table WHERE id IN $ids", {
    table: PAGE_TABLE_NAME,
    ids,
  });
}

export async function findNopalPageById(id: string) {
  const page = await select<NopalPage>(new RecordId(PAGE_TABLE_NAME, id));
  if (page) {
    const blocks = await findNopalBlockById(id);
    page.pageDetails = blocks?.blocks || [];
  }
  return page;
}

export async function findAllNopalBlocksByIds(ids: string[]) {
  return await query<NopalBlock[]>("SELECT * FROM $table WHERE id IN $ids", {
    table: BLOCK_TABLE_NAME,
    ids,
  });
}

export async function findNopalBlockById(id: string) {
  return await select<NopalBlock>(new RecordId(BLOCK_TABLE_NAME, id));
}

export async function getAllPagesByDbRef(dbName: string) {
  return await query(`SELECT page.* FROM ${dbName}`, {
    limit: 100,
    start: 0,
  }).then((_results) => {
    return (_results?.[0] || []) as { page: NopalPage }[];
  });
}

export async function getPageByDbRefAndSlug(dbName: string, slug: string) {
  const results = await query(
    `SELECT page.*, page.pageDetails.* FROM ${dbName} WHERE page.properties.Slug.rich_text[0].plain_text = '${slug}'`
  );
  if (results.length === 1) {
    const r = results[0] as { page: NopalPage }[];
    const record = r[0] || null;
    if (record?.page) {
      return record.page;
    }
  }
  return null;
}
