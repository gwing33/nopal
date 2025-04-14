export function isPublished(obj: any): boolean {
  const status = obj.properties["Status"];
  return status.select?.name === "published";
}

export function isFavorite(obj: any): boolean {
  const favorite = obj.properties["Recommendation"];
  return favorite?.select?.name === "Nopal Favorite";
}
