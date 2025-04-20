import { Client } from "@notionhq/client";
import { QueryDatabaseResponse } from "@notionhq/client/build/src/api-endpoints";
import {
  queryCollection,
  defineNotionTable,
  upsertToNotionTable,
  query,
  formatRecord,
} from "./generic.server";

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
    id: "1d6f2211e45f803a880dcbd7701ec65d",
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
      return formatIngredientRecord(formatRecord(record), {
        includeDetails: true,
      });
    }
  }
  return null;
}

type Annotation = {
  bold?: boolean;
  italic?: boolean;
  strikethrough?: boolean;
  underline?: boolean;
  code?: boolean;
  color?: "default";
};

export type RichText = {
  plain_text: string;
  annotations: Annotation;
};

type Paragraph = {
  color: "default";
  rich_text: RichText[];
};

type Heading = {
  color: "default";
  is_toggleable: boolean;
  rich_text: RichText[];
};

type ListItem = {
  color: "default";
  rich_text: RichText[];
};

type Image = {
  caption: RichText[];
  file: { expiry_time: string; url: string };
  type: "file";
};

type User = {
  id: string;
  object: string;
};

export type PageDetail = {
  archived: boolean;
  created_by: User;
  created_time: string;
  has_children: boolean;
  id: string;
  in_trash: boolean;
  last_edited_by: User;
  last_edited_time: string;
  object: "block";
  heading_1?: Heading;
  heading_2?: Heading;
  heading_3?: Heading;
  paragraph?: Paragraph;
  bulleted_list_item?: ListItem;
  image?: Image;
  parent: { page_id: string; type: string };
  type:
    | "heading_1"
    | "heading_2"
    | "heading_3"
    | "paragraph"
    | "bulleted_list_item"
    | "image";
};

export type IngredientRecord = {
  id: { id: string; table: string };
  _id: string;
  name: string;
  summary: { id: string; rich_text: RichText[]; type: string };
  status: string;
  recommendation: string;
  comfortScore: number;
  efficiencyScore: number;
  longevityScore: number;
  socialImpactScore: number;
  carbonScore: number;
  pageDetails: PageDetail[];
};

function formatIngredientRecord(
  record: any,
  { includeDetails }: { includeDetails: boolean }
): IngredientRecord {
  const ingredient = {
    id: record.id,
    _id: record._id,
    name: record.properties.Name.title[0].plain_text,
    slug: record.properties.Slug.rich_text[0].plain_text,
    summary: record.properties.Summary,
    status: record.properties.Status.select?.name || "",
    recommendation: record.properties.Recommendation.select?.name || "",
    gbs: 0,
    comfortScore: record.properties["Comfort Score"].number,
    efficiencyScore: record.properties["Efficiency Score"].number,
    longevityScore: record.properties["Longevity Score"].number,
    socialImpactScore: record.properties["Social Impact Score"].number,
    carbonScore: record.properties["Carbon Score"].number,
    pageDetails: includeDetails ? record.pageDetails.results : [],
  };
  ingredient.gbs = getGBSScore(ingredient);
  return ingredient;
}
function getGBSScore(ingredient: IngredientRecord): number {
  return (
    ingredient.comfortScore +
    ingredient.efficiencyScore +
    ingredient.longevityScore +
    ingredient.socialImpactScore +
    ingredient.carbonScore
  );
}

export function getAllIngredients(): Promise<any> {
  return queryCollection(
    `SELECT * FROM ${INGREDIENTS}`,
    {},
    { limit: 100 }
  ).then((results) => {
    return {
      ...results,
      data: results.data.map((r) =>
        formatIngredientRecord(r, { includeDetails: false })
      ),
    };
  });
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
          const pageDetails = await getPageDetails(page);
          const newPage = { ...page, pageDetails };
          const r = await upsertToNotionTable(db.dbName, newPage);
          return r?.[0];
        })
      );
      console.log("Done.", db.dbName);
      return processedResults;
    });
}

async function getPageDetails(page: any): Promise<any> {
  return notion.blocks.children.list({
    block_id: page.id,
  });
}

export async function syncAllDatabases(): Promise<QueryDatabaseResponse[]> {
  return Promise.all(dbs.map((db) => getDatabasePages(db))).then((pages) => {
    return pages;
  });
}
