import type { Project } from "../data/getProjects.server";
import { useMarkdown } from "../hooks/useMarkdown";
import { formatDate } from "../util/formatDate";
import { formatArtMediumIdToText } from "../util/formatArtMediumIdToText";
import { ProjectLink } from "./ProjectLink";
import { getInstagramUrl } from "../util/getInstagramUrl";
import { getRecordId } from "../util/getRecordId";

type PrintProps = {
  print: Project;
};

export function Print({ print }: PrintProps) {
  const {
    title,
    type,
    author,
    date,
    body,
    externalHref,
    instagramId,
    customImage,
  } = print;
  const { id } = getRecordId(print.id);

  const href = instagramId ? getInstagramUrl(instagramId) : externalHref;
  const bodyHtml = useMarkdown(body);
  return (
    <div className="pb-4 print">
      <div className="flex flex-col sm:flex-row">
        <div
          className="flex-shrink-0"
          style={{
            maxWidth: "356px",
            maxHeight: "356px",
          }}
        >
          <img src={customImage || `/uncooked/${id}.jpg`} alt={title} />
        </div>
        <div className="pt-4 sm:pt-0 sm:pl-4">
          <h3 className="font-bold">{title}</h3>
          <div className="pb-4">
            by: {author}, {formatDate(new Date(date))}
          </div>
          {bodyHtml}
          <ProjectLink externalHref={href}>
            {formatArtMediumIdToText(id, type)}
          </ProjectLink>
        </div>
      </div>
    </div>
  );
}
