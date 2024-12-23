import type { Uncooked } from "../data/uncooked.server";
import { useMarkdown } from "../hooks/useMarkdown";
import { formatDate } from "../util/formatDate";
import { formatArtMediumIdToText } from "../util/formatArtMediumIdToText";
import { UncookedLink } from "./UncookedLink";
import { getInstagramUrl } from "../util/getInstagramUrl";

type ViewMasterReelProps = {
  reel: Uncooked;
};
export function ViewMasterReel({ reel }: ViewMasterReelProps) {
  const { title, type, author, date, body, externalHref, instagramId, images } =
    reel;
  const { id } = reel.id;
  const bodyHtml = useMarkdown(body);
  const gridRows = (images?.length || 0) > 2 ? "grid-rows-2" : "grid-rows-1";
  const href = instagramId ? getInstagramUrl(instagramId) : externalHref;
  return (
    <div className="pb-4 view-master-reel">
      <div className="flex flex-col sm:flex-row">
        <div
          className={"flex-shrink-0 grid grid-cols-2 gap-2 " + gridRows}
          style={{
            maxWidth: "356px",
            maxHeight: "356px",
          }}
        >
          {images?.map((img, idx) => (
            <div
              key={img}
              className="flex-shrink-0"
              style={{
                maxWidth: "174px",
                maxHeight: "174px",
              }}
            >
              <img
                src={`/uncooked/${img}.jpg`}
                alt={`${title} slide ${idx + 1}`}
              />
            </div>
          ))}
        </div>
        <div className="pt-4 sm:pt-0 sm:pl-4">
          <h3 className="font-bold">{title}</h3>
          <div className="pb-4">
            by: {author}, {formatDate(new Date(date))}
          </div>
          {bodyHtml}
          <UncookedLink externalHref={href}>
            {formatArtMediumIdToText(id, type)}
          </UncookedLink>
        </div>
      </div>
    </div>
  );
}
