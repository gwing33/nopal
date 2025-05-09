import type { BlockObjectResponse } from "@notionhq/client/build/src/api-endpoints";

export type Annotation = {
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
