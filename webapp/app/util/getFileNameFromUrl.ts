export function getFileNameFromUrl(url: string): string {
  const urlObj = new URL(url);
  const path = urlObj.pathname;
  const fileName = path.split("/").pop();
  return fileName || "";
}
