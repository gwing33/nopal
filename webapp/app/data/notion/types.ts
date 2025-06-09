import type { BlockObjectResponse } from "@notionhq/client/build/src/api-endpoints";

export type RichText = {
  plain_text: string;
  annotations: {
    bold?: boolean;
    italic?: boolean;
    strikethrough?: boolean;
    underline?: boolean;
    code?: boolean;
    color?: "default";
  };
};

export type IngredientRecord = {
  id: { id: string; tb: string };
  _id: string;
  name: string;
  summary: { id: string; rich_text: RichText[]; type: string };
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
