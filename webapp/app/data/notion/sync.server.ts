import { Client } from "@notionhq/client";
import {
  getAllDbs,
  getDbByName,
  defineNotionTables,
  definePageField,
  upsertPage,
  upsertBlock,
  findAllNopalBlocks,
  findNopalPageById,
} from "./core.server";
import type { NotionDatabase } from "./core.server";
import { downloadAndUploadToS3 } from "../file.server";
import { getFileNameFromUrl } from "../../util/getFileNameFromUrl";
import { getBlockObjectResponseWithRichText } from "../../util/notion";
import { defineTable, upsert } from "../generic.server";
import {
  ListBlockChildrenResponse,
  BlockObjectResponse,
  PageObjectResponse,
  RichTextItemResponse,
} from "@notionhq/client/build/src/api-endpoints";

import { initDbs } from "./init.server";

initDbs();

// Initializing a client
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

async function getAllPagesFromNotionDB(db: NotionDatabase) {
  return await notion.databases.query({
    database_id: db.id,
    page_size: 100,
  });
}

async function getPageDetails(id: string) {
  return await notion.blocks.children.list({
    block_id: id,
  });
}

async function syncPageDetailImagesAndFiles(
  details: ListBlockChildrenResponse
) {
  await Promise.all(
    details.results.map(async (_detail) => {
      const detail = _detail as BlockObjectResponse;
      if (detail.type == "image" && detail.image?.type == "file") {
        const name = getFileNameFromUrl(detail.image.file.url);

        detail.image.file.url = await downloadAndUploadToS3(
          detail.image.file.url,
          name
        );
        console.log("File Uploaded: ", detail.image.file.url);
        detail.image.file.expiry_time = "";
      }
      if (detail.has_children) {
        const childrenDetails = await syncPageDetailImagesAndFiles(
          await getPageDetails(detail.id)
        );
        // @ts-ignore
        detail.children = childrenDetails;
      }
      return detail;
    })
  );
  return details;
}

async function syncFileProperties(page: PageObjectResponse) {
  await Promise.all(
    Object.entries(page.properties || {}).map(async ([key, value]) => {
      if (value.type == "files") {
        const files = value.files;
        return await Promise.all(
          files.map(async (file) => {
            if (file.type == "file" && file.name && file.file.url) {
              file.file.url = await downloadAndUploadToS3(
                file.file.url,
                file.name
              );
              console.log("File Uploaded: ", file.file.url);
              file.file.expiry_time = "";
            }
          })
        );
      }
    })
  );
}

async function updateNotionLinks() {
  const blocks = await findAllNopalBlocks();
  await Promise.all(
    blocks.map(async (block) => {
      let changed = false;
      await Promise.all(
        (block.results || []).map(async (result) => {
          const blockObj = result as BlockObjectResponse;
          const r = getBlockObjectResponseWithRichText(blockObj);
          if (!r) return null;
          return await Promise.all(
            r.rich_text?.map(async (richText: RichTextItemResponse) => {
              if (
                richText.type == "mention" &&
                richText.mention.type == "page"
              ) {
                const pageId = richText.mention.page.id;
                const page = await findNopalPageById(pageId);
                if (page?.public_url) {
                  richText.href = page.public_url;
                  changed = true;
                }
                return page;
              }
              return null;
            })
          );
        })
      );
      if (changed) {
        return await upsertBlock(block);
      }
      return null;
    })
  );
}

/**
 * Sync a single Notion page into the local DB.
 * Handles slug resolution, file uploads, block children, and DB ref upsert.
 */
async function syncPage(page: PageObjectResponse, db: NotionDatabase) {
  if (
    page.properties.Slug?.type == "rich_text" &&
    page.properties.Slug?.rich_text?.[0]?.plain_text
  ) {
    const slug = page.properties.Slug.rich_text[0].plain_text.trim();
    page.properties.Slug.rich_text[0].plain_text = slug;
    page.public_url = db.getPublicUrl(slug);
  }

  await syncFileProperties(page);

  const details = await syncPageDetailImagesAndFiles(
    await getPageDetails(page.id)
  );
  // Save block
  const block = (await upsertBlock(details))?.[0];

  // Save Page
  const newPage = (
    await upsertPage({ ...page, pageDetails: block?.id } as any)
  )?.[0];

  if (newPage) {
    // Save reference to page on the specific DB
    await upsert(db.dbName, { id: newPage.id.id, page: newPage.id });
  }
  return newPage;
}

export async function syncAllDatabases() {
  try {
    console.log("Defining Notion Tables");
    defineNotionTables();

    const dbs = getAllDbs();

    await Promise.all(
      dbs.map(async (db) => {
        console.log(`Syncing ${db.dbName} Table`);
        defineTable(db.dbName);
        definePageField(db.dbName);

        const pages = await getAllPagesFromNotionDB(db);
        return await Promise.all(
          pages.results.map(async (_page) => {
            return syncPage(_page as PageObjectResponse, db);
          })
        );
      })
    );

    // Update Notion Links to nopal specific links
    await updateNotionLinks();
  } catch (e) {
    console.log("Error", e);
    return "failed";
  }
  console.log("Done Syncing");
  return "success";
}

/**
 * Sync a single page by its Notion page ID.
 * Fetches the page from Notion, determines which registered DB it belongs to,
 * and syncs just that page (including files, blocks, and link updates).
 */
export async function syncSinglePage(pageId: string) {
  try {
    console.log(`Syncing single page: ${pageId}`);
    defineNotionTables();

    // Fetch the page from Notion
    const page = (await notion.pages.retrieve({
      page_id: pageId,
    })) as PageObjectResponse;

    // Determine which registered DB this page belongs to
    const parentDbId =
      page.parent.type === "database_id"
        ? page.parent.database_id.replace(/-/g, "")
        : null;

    const dbs = getAllDbs();
    const db = dbs.find((d) => d.id === parentDbId);

    if (!db) {
      console.log(
        `Page ${pageId} does not belong to any registered DB (parent: ${parentDbId})`
      );
      return "skipped";
    }

    defineTable(db.dbName);
    definePageField(db.dbName);

    await syncPage(page, db);
    await updateNotionLinks();

    console.log(`Done syncing page: ${pageId}`);
    return "success";
  } catch (e) {
    console.log("Error syncing single page", e);
    return "failed";
  }
}

/**
 * Sync an entire registered database by its local dbName.
 */
export async function syncDatabaseByName(dbName: string) {
  try {
    const db = getDbByName(dbName);
    if (!db) {
      console.log(`No registered DB found with name: ${dbName}`);
      return "skipped";
    }

    console.log(`Syncing database: ${dbName}`);
    defineNotionTables();
    defineTable(db.dbName);
    definePageField(db.dbName);

    const pages = await getAllPagesFromNotionDB(db);
    await Promise.all(
      pages.results.map(async (_page) => {
        return syncPage(_page as PageObjectResponse, db);
      })
    );

    await updateNotionLinks();
    console.log(`Done syncing database: ${dbName}`);
    return "success";
  } catch (e) {
    console.log("Error syncing database", e);
    return "failed";
  }
}
