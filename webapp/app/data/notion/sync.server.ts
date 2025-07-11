import { Client } from "@notionhq/client";
import {
  getAllDbs,
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

            // Skip page if it's already synced.
            // DISABLED FOR NOW
            // const dbPage = await findNopalPageById(page.id);
            // if (dbPage && dbPage.last_edited_time == page.last_edited_time) {
            //   console.log("Skipping page:", page.id);
            //   return null;
            // }
            // console.log("Syncing page:", page.id);

            const slugProp = page.properties.Slug || null;
            if (
              page.properties.Slug.type == "rich_text" &&
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
