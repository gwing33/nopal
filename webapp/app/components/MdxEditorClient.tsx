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
import { useRef, useEffect, useState, useCallback } from "react";

const IMAGE_MIME = /^image\//i;
const IMAGE_EXT = /\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff|ico)(\?.*)?$/i;

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
      const file = e.target.files?.[0];
      if (!file || !uploadFile) return;
      e.target.value = ""; // allow re-selecting the same file

      setIsUploading(true);
      try {
        const url = await uploadFile(file);
        const isImage = IMAGE_MIME.test(file.type) || IMAGE_EXT.test(file.name);
        const md = isImage
          ? `\n\n![${file.name}](${url})\n\n`
          : `\n\n[${file.name}](${url})\n\n`;
        editorRef.current?.insertMarkdown(md);
      } catch (err) {
        console.error("Upload error:", err);
      } finally {
        setIsUploading(false);
      }
    },
    [uploadFile],
  );

  return (
    <div style={{ position: "relative" }}>
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
          imagePlugin({ imageUploadHandler }),
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
            style={{ display: "none" }}
            onChange={handleFileSelect}
          />
        </>
      )}
    </div>
  );
}
