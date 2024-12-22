import type { Project } from "../data/getProjects.server";
import { useMarkdown } from "../hooks/useMarkdown";
import { formatDate } from "../util/formatDate";
import { formatArtMediumIdToText } from "../util/formatArtMediumIdToText";
import { ProjectLink } from "./ProjectLink";

type NewspaperClippingProps = {
  clipping: Project;
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
      <ProjectLink to={`/uncooked/${id}`}>
        {formatArtMediumIdToText(id, type)}
      </ProjectLink>
    </div>
  );
}
