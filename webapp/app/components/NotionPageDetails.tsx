import { getPlainText, NotionText } from "./NotionText";
import type { PageDetail } from "../data/notion.server";

export function NotionPageDetails({
  pageDetails,
}: {
  pageDetails: PageDetail[];
}) {
  return pageDetails?.map((detail) => {
    switch (detail.type) {
      case "heading_1":
        return <Heading1 key={detail.id} detail={detail} />;
      case "heading_2":
        return <Heading2 key={detail.id} detail={detail} />;
      case "heading_3":
        return <Heading3 key={detail.id} detail={detail} />;
      case "paragraph":
        return <Paragraph key={detail.id} detail={detail} />;
      case "bulleted_list_item":
        return <BulletedListItem key={detail.id} detail={detail} />;
      case "image":
        return <Image key={detail.id} detail={detail} />;
    }
  });
}

function Heading1({ detail }: { detail: PageDetail }) {
  return (
    <h1 className="font-bold purple-light-text text-4xl mt-12">
      <NotionText text={detail.heading_1?.rich_text || []} />
    </h1>
  );
}

function Heading2({ detail }: { detail: PageDetail }) {
  return (
    <h2 className="font-bold green-text text-3xl mt-8">
      <NotionText text={detail.heading_2?.rich_text || []} />
    </h2>
  );
}

function Heading3({ detail }: { detail: PageDetail }) {
  return (
    <h3 className="font-bold green-text text-2xl mt-4">
      <NotionText text={detail.heading_3?.rich_text || []} />
    </h3>
  );
}

function Paragraph({ detail }: { detail: PageDetail }) {
  return (
    <p className="text-xl mt-2">
      <NotionText text={detail.paragraph?.rich_text || []} />
    </p>
  );
}

function BulletedListItem({ detail }: { detail: PageDetail }) {
  return (
    <ul className="list-disc ml-4 text-xl mt-2">
      <li>
        <NotionText text={detail.bulleted_list_item?.rich_text || []} />
      </li>
    </ul>
  );
}

function Image({ detail }: { detail: PageDetail }) {
  const image = detail.image;
  const url = image?.file?.url;
  if (!url) return null;

  const caption = getPlainText(image.caption);

  return <img className="mt-4" src={url} alt={caption} />;
}
