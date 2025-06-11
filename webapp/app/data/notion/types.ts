import type { BlockObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import type { RichTextItemResponse } from "@notionhq/client/build/src/api-endpoints";

export type RichText = {
  id: string;
  rich_text: RichTextItemResponse[];
  type: string;
};

export type IngredientRecord = {
  id: { id: string; tb: string };
  _id: string;
  name: string;
  summary: RichText;
  status: string;
  slug: string;
  recommendation: string;
  gbs: number;
  comfortScore: number;
  efficiencyScore: number;
  longevityScore: number;
  socialImpactScore: number;
  carbonScore: number;
  svg: string;
  pageDetails: BlockObjectResponse[];
};

export type TastingRecord = {
  id: { id: string; tb: string };
  _id: string;
  name: string;
  summary: RichText;
  status: string;
  slug: string;
  thumbnail: string;
  scores: number[];
  pageDetails: BlockObjectResponse[];
};
