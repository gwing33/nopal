import "@mdxeditor/editor/style.css";
import "../styles/mdxeditor.css";
import {
  MDXEditor,
  type MDXEditorMethods,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  linkPlugin,
  linkDialogPlugin,
  imagePlugin,
} from "@mdxeditor/editor";
import { useRef, useEffect, useState, useCallback, type FC } from "react";

const IMAGE_MIME = /^image\//i;
const IMAGE_EXT = /\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff|ico)(\?.*)?$/i;
/** Matches a line that is purely an image reference: ![alt](url) */
const IMAGE_LINE_RE = /^!\[.*?\]\(.*?\)$/;

/** Camera SVG shown in place of images that fail to load */
const BROKEN_IMAGE_URI = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  `<svg id="nopal-broken" xmlns="http://www.w3.org/2000/svg" width="160" height="108" viewBox="0 0 160 108"><rect x="14" y="24" width="132" height="67" rx="10" fill="none" stroke="#c0c0c0" stroke-width="2" stroke-dasharray="5 3"/><circle cx="80" cy="58" r="22" fill="none" stroke="#c0c0c0" stroke-width="2"/><circle cx="80" cy="58" r="11" fill="none" stroke="#c0c0c0" stroke-width="1.5"/><path d="M60 24 L60 16 Q60 9 67 9 L93 9 Q100 9 100 16 L100 24" fill="none" stroke="#c0c0c0" stroke-width="2" stroke-linejoin="round"/><rect x="23" y="33" width="14" height="9" rx="2.5" fill="none" stroke="#c0c0c0" stroke-width="1.5"/><text x="80" y="106" text-anchor="middle" font-size="16" font-family="system-ui,-apple-system,sans-serif" fill="#c0c0c0">Image not found</text></svg>`,
)}`;

/** Replaces the MDXEditor edit/delete image toolbar with nothing */
const NullEditToolbar: FC = () => null;

// ── URL-embed helpers ────────────────────────────────────────────────────────

/** Matches a paste whose entire content is a single URL. */
const BARE_URL_RE = /^https?:\/\/\S+$/i;

/**
 * Handles youtube.com/watch?v=, youtu.be/, /shorts/, /live/, and /embed/.
 * Capture group 1 is the 11-character video ID.
 */
const YOUTUBE_RE =
  /(?:youtube\.com\/(?:watch\?(?:.*?&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

/** Vimeo – captures the numeric video ID. */
const VIMEO_RE = /vimeo\.com\/(?:video\/)?(\d+)/;

/**
 * Returns an iframe HTML string for known video hosts, or null for everything
 * else. The caller is responsible for wrapping it in blank lines so it becomes
 * a block-level element in the stored markdown.
 */
function buildVideoEmbed(url: string): string | null {
  const yt = url.match(YOUTUBE_RE);
  if (yt) {
    return (
      `<iframe width="560" height="315" ` +
      `src="https://www.youtube.com/embed/${yt[1]}" ` +
      `title="YouTube video" frameBorder="0" ` +
      `allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" ` +
      `allowFullScreen />`
    );
  }
  const vm = url.match(VIMEO_RE);
  if (vm) {
    return (
      `<iframe src="https://player.vimeo.com/video/${vm[1]}" ` +
      `width="560" height="315" frameBorder="0" ` +
      `allow="autoplay; fullscreen; picture-in-picture" ` +
      `allowFullScreen title="Vimeo video" />`
    );
  }
  return null;
}

export interface EditorHandle {
  insertMarkdown: (markdown: string) => void;
}

interface MdxEditorClientProps {
  markdown: string;
  onChange: (md: string) => void;
  /** Called to upload any file; return the public URL. When omitted, the attach button is hidden. */
  uploadFile?: (file: File) => Promise<string>;
  onEditorReady?: (handle: EditorHandle) => void;
}

export default function MdxEditorClient({
  markdown,
  onChange,
  uploadFile,
  onEditorReady,
}: MdxEditorClientProps) {
  const editorRef = useRef<MDXEditorMethods>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (editorRef.current && onEditorReady) {
      onEditorReady({
        insertMarkdown: (md: string) => editorRef.current?.insertMarkdown(md),
      });
    }
    // Intentionally run once on mount — onEditorReady identity is stable via useCallback
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Returns a camera-SVG placeholder for images that fail to load
  const imagePreviewHandler = useCallback(
    async (src: string): Promise<string> => {
      if (src.startsWith("data:")) return src;
      const ok = await new Promise<boolean>((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = src;
      });
      return ok ? src : BROKEN_IMAGE_URI;
    },
    [],
  );

  // Used by the MDX imagePlugin for drag-and-drop / paste uploads
  const imageUploadHandler = useCallback(
    async (file: File): Promise<string> => {
      if (!uploadFile) return "";
      return uploadFile(file);
    },
    [uploadFile],
  );

  // Triggered by the hidden file input behind the + button
  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (!files.length || !uploadFile) return;
      e.target.value = ""; // allow re-selecting the same files

      setIsUploading(true);
      try {
        // Upload all files in parallel
        const results = await Promise.all(
          files.map(async (file) => {
            const url = await uploadFile(file);
            const isImage =
              IMAGE_MIME.test(file.type) || IMAGE_EXT.test(file.name);
            return { file, url, isImage };
          }),
        );

        const editor = editorRef.current;
        if (!editor) return;

        let accumulated = editor.getMarkdown().trimEnd();

        for (const { file, url, isImage } of results) {
          if (isImage) {
            // Group consecutive images in the same paragraph so the grid CSS kicks in.
            // If the last non-empty line is already an image reference, use a single
            // newline (same paragraph). Otherwise open a fresh paragraph.
            const lastLine = accumulated.split("\n").at(-1)?.trim() ?? "";
            const prevIsImage = IMAGE_LINE_RE.test(lastLine);
            const sep =
              accumulated.length === 0 ? "" : prevIsImage ? "\n" : "\n\n";
            accumulated = accumulated + sep + `![${file.name}](${url})`;
          } else {
            // Non-image files always get their own paragraph line.
            const sep = accumulated.length === 0 ? "" : "\n\n";
            accumulated = accumulated + sep + `[${file.name}](${url})`;
          }
        }

        editor.setMarkdown(accumulated);
        // Return focus to the editor so the user can keep typing
        editor.focus();
      } catch (err) {
        console.error("Upload error:", err);
      } finally {
        setIsUploading(false);
      }
    },
    [uploadFile],
  );

  /**
   * Intercepts paste events on the editor container.
   * If the pasted text is a bare URL we take over and insert the appropriate
   * markdown rather than letting the editor drop it as plain text:
   *   - YouTube / Vimeo  →  <iframe> embed (renders as a video player)
   *   - Image URL        →  ![](url)
   *   - Any other URL    →  [url](url)
   *
   * File pastes (e.g. image data from the clipboard) carry no text/plain
   * content, so BARE_URL_RE won't match and they pass through to the
   * imagePlugin unaffected.
   */
  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    const text = e.clipboardData.getData("text/plain").trim();
    if (!BARE_URL_RE.test(text)) return;

    const editor = editorRef.current;
    if (!editor) return;

    // 1. Known video host → iframe embed
    const videoEmbed = buildVideoEmbed(text);
    if (videoEmbed) {
      e.preventDefault();
      editor.insertMarkdown(`\n\n${videoEmbed}\n\n`);
      return;
    }

    // 2. Image URL → inline image
    if (IMAGE_EXT.test(text)) {
      e.preventDefault();
      editor.insertMarkdown(`![](${text})`);
      return;
    }

    // 3. Everything else → markdown link
    e.preventDefault();
    editor.insertMarkdown(`[${text}](${text})`);
  }, []);

  return (
    <div style={{ position: "relative" }} onPaste={handlePaste}>
      <MDXEditor
        ref={editorRef}
        markdown={markdown}
        onChange={onChange}
        plugins={[
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          thematicBreakPlugin(),
          markdownShortcutPlugin(),
          linkPlugin(),
          linkDialogPlugin(),
          imagePlugin({
            imageUploadHandler,
            imagePreviewHandler,
            EditImageToolbar: NullEditToolbar,
          }),
        ]}
      />

      {uploadFile && (
        <>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            title={isUploading ? "Uploading…" : "Attach a photo or file"}
            className="font-mono"
            style={{
              position: "absolute",
              bottom: "10px",
              right: "10px",
              zIndex: 10,
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: isUploading
                ? "var(--text-subtle, #aaa)"
                : "var(--purple-light, #a78bfa)",
              color: "#fff",
              border: "none",
              cursor: isUploading ? "wait" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: isUploading ? 0.6 : 1,
              boxShadow: "0 2px 8px rgba(0,0,0,0.20)",
              padding: 0,
              transition: "opacity 0.15s, background 0.15s",
              flexShrink: 0,
            }}
          >
            {isUploading ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.h264"
            multiple
            style={{ display: "none" }}
            onChange={handleFileSelect}
          />
        </>
      )}
    </div>
  );
}
