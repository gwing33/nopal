/**
 * Small, pure display helpers shared by the /public/* (unauthenticated)
 * vault-browsing routes. No server-only imports — safe on client too.
 */

export function fileIcon(contentType: string): string {
  if (contentType.startsWith("image/")) return "🖼️";
  if (contentType === "application/pdf") return "📄";
  if (contentType === "text/markdown") return "📝";
  if (contentType === "text/csv") return "📊";
  if (contentType.startsWith("video/")) return "🎬";
  return "📎";
}

export function formatSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDate(iso: string): string {
  // Parse the calendar date directly from the ISO string so server (UTC)
  // and browser (local timezone) always produce the same string and React
  // hydration stays in sync.
  const [datePart] = iso.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function isMarkdownFile(file: {
  name: string;
  content_type: string;
}): boolean {
  return (
    file.content_type === "text/markdown" ||
    file.name.toLowerCase().endsWith(".md")
  );
}

export function isImageFile(file: { content_type: string }): boolean {
  return file.content_type.startsWith("image/");
}

/**
 * Feature-detects the Web Share API's file-sharing form (`navigator.share
 * ({ files })`) — the only standards-based way to hand files to the native
 * OS share sheet, whose "Save Image(s)"/gallery-app target is in turn the
 * only way to get a file into the phone's Photos library without a manual
 * long-press per image. Not supported on desktop browsers or older
 * mobile ones, hence the feature check rather than assuming it's there.
 * Only ever call this client-side (references `navigator`/`File`) — safe
 * to import server-side since nothing here executes at module load.
 */
export function canShareImageFiles(): boolean {
  if (typeof navigator === "undefined" || !navigator.canShare) return false;
  try {
    const probe = new File([""], "probe.jpg", { type: "image/jpeg" });
    return navigator.canShare({ files: [probe] });
  } catch {
    return false;
  }
}

/**
 * Triggers a real browser "Save As" download from whatever a download-
 * manifest endpoint (`/api/vault/public-folders/:folderId/download-
 * manifest` or its authenticated counterpart in `fruits_.vault.tsx`)
 * handed back — an S3-backed file's presigned `url` (browser navigates
 * straight to it), or a content-only file's inline `content` (Blob-
 * download client-side, since there's no S3 object to point a URL at).
 */
export function triggerFileDownload(entry: {
  name: string;
  url?: string;
  content?: string;
  contentType?: string;
}): void {
  const a = document.createElement("a");
  a.download = entry.name;
  let objectUrl: string | null = null;
  if (entry.url) {
    a.href = entry.url;
  } else if (entry.content !== undefined) {
    const blob = new Blob([entry.content], {
      type: entry.contentType || "text/plain",
    });
    objectUrl = URL.createObjectURL(blob);
    a.href = objectUrl;
  } else {
    return;
  }
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  if (objectUrl) URL.revokeObjectURL(objectUrl);
}
