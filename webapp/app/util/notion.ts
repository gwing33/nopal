import { BlockObjectResponse } from "@notionhq/client/build/src/api-endpoints";

export function getBlockObjectResponseWithRichText(block: BlockObjectResponse) {
  switch (block.type) {
    case "heading_1":
      return block[block.type];
    case "heading_2":
      return block[block.type];
    case "heading_3":
      return block[block.type];
    case "paragraph":
      return block[block.type];
    case "bulleted_list_item":
      return block[block.type];
    case "code":
      return block[block.type];
    case "callout":
      return block[block.type];
  }
  return null;
}
