import { Client } from "@notionhq/client";
import {
  getAllDbs,
  defineNotionTables,
  definePageField,
  upsertPage,
  upsertBlock,
} from "./core.server";
import type { NopalBlock, NotionDatabase, NopalPage } from "./core.server";
import { downloadAndUploadToS3 } from "../file.server";
import { getFileNameFromUrl } from "../../util/getFileNameFromUrl";
import { defineTable, upsert, formatRecord } from "../generic.server";
import {
  ListBlockChildrenResponse,
  BlockObjectResponse,
  PageObjectResponse,
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

async function getPageDetails(page: PageObjectResponse) {
  return await notion.blocks.children.list({
    block_id: page.id,
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
            const page = _page as PageObjectResponse;
            await syncFileProperties(page);

            const details = await syncPageDetailImagesAndFiles(
              await getPageDetails(page)
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
          })
        );
      })
    );

    // TODO: Now update all mention URLs
  } catch (e) {
    console.log("Error", e);
    return "failed";
  }
  return "success";
}
