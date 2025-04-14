import { Client } from "@notionhq/client";
import { QueryDatabaseResponse } from "@notionhq/client/build/src/api-endpoints";
import {
  queryCollection,
  defineNotionTable,
  upsertToNotionTable,
  query,
  formatRecord,
} from "./generic.server";
import { getDb } from "./db.server";

// Initializing a client
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

type Database = {
  id: string;
  dbName: string;
};

const INGREDIENTS = "gbs_ingredients";
const RECIPES = "gbs_recipes";
const COLLECTIONS = "gbs_collections";

const dbs: Database[] = [
  {
    id: "1d1f2211e45f80a7a7a7e2ecb09ff6da",
    dbName: INGREDIENTS,
  },
  {
    id: "1d1f2211e45f808c9103e2d4f63c1f83",
    dbName: RECIPES,
  },
  {
    id: "1d1f2211e45f80df81c3c82b831b45c1",
    dbName: COLLECTIONS,
  },
];

export type NotionObject = {
  id: string;
  title: string;
  properties: any;
  [n: string]: any;
};

export async function getIngredientBySlug(slug: string): Promise<any> {
  const results = await query(
    `SELECT * FROM ${INGREDIENTS} WHERE properties.Slug.rich_text[0].plain_text = '${slug}'`
  );
  if (results.length === 1) {
    const r: any = results[0];
    const record = r[0] || null;
    if (record) {
      return formatRecord(record);
    }
  }
  return null;
}
export function getAllIngredients(): Promise<any> {
  return queryCollection(`SELECT * FROM ${INGREDIENTS}`);
}
export function getAllRecipes(): Promise<any> {
  return queryCollection(`SELECT * FROM ${RECIPES}`);
}
export function getAllCollections(): Promise<any> {
  return queryCollection(`SELECT * FROM ${COLLECTIONS}`);
}

async function getDatabasePages(db: Database): Promise<any> {
  return notion.databases
    .query({
      database_id: db.id,
      page_size: 100,
    })
    .then(async (resp) => {
      console.log("Defining Table", db.dbName);
      await defineNotionTable(db.dbName);
      console.log("Upserting...", db.dbName);
      const processedResults = await Promise.all(
        resp.results.map(async (page) => {
          const r = await upsertToNotionTable(db.dbName, page);
          return r?.[0];
        })
      );
      console.log("Done.", db.dbName);
      return processedResults;
    });
}

export async function syncAllDatabases(): Promise<QueryDatabaseResponse[]> {
  return Promise.all(dbs.map((db) => getDatabasePages(db))).then((pages) => {
    return pages;
  });
}
