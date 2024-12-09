import type { ArtMedium } from "../data/getProjects";

export function formatArtMediumIdToText(id: string, type: ArtMedium): string {
  const parts = id.split("-");
  const lastPart = parts[parts.length - 1];
  return `${getTextByArtMedium(type)} No.${lastPart}`;
}

function getTextByArtMedium(type: ArtMedium) {
  switch (type) {
    case "newspaper-clipping":
      return "Newspaper Clipping";
    case "betamax":
      return "Betamax";
    case "print":
      return "Print";
    case "view-master-reel":
      return "View-Master Reel";
    case "presentation":
      return "Presentation";
  }
  return "";
}
