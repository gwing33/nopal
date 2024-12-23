import type { Uncooked } from "../data/uncooked.server";
import { useMarkdown } from "../hooks/useMarkdown";
import { formatDate } from "../util/formatDate";
import { formatArtMediumIdToText } from "../util/formatArtMediumIdToText";
import { UncookedLink } from "./UncookedLink";

type NewspaperClippingProps = {
  clipping: Uncooked;
};
export function NewspaperClipping({ clipping }: NewspaperClippingProps) {
  const { title, type, author, date, body, id } = clipping;
  const bodyHtml = useMarkdown(body);
  return (
    <div className="pb-8">
      <h3 className="font-bold">{title}</h3>
      <div className="pb-4">
        by: {author}, {formatDate(new Date(date))}
      </div>
      {bodyHtml}
      <UncookedLink to={`/uncooked/${id}`}>
        {formatArtMediumIdToText(id.id, type)}
      </UncookedLink>
    </div>
  );
}
