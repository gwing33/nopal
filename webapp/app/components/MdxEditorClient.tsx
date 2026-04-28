import "@mdxeditor/editor/style.css";
import "../styles/mdxeditor.css";
import { buildDisplayMarkdown } from "../util/nopalMarkdown";
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
} from "@mdxeditor/editor";
import {
  useRef,
  useEffect,
  useLayoutEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { useMarkdown } from "../hooks/useMarkdown";

const IMAGE_MIME = /^image\//i;
const IMAGE_EXT = /\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff|ico)(\?.*)?$/i;

const NOPAL_MARKER = "\n\n# Nopal Markdown\nFiles";
const FILE_LINE_RE = /^\[(\d+)\]\s+(.+)$/;
const STACK_THRESHOLD = 32;
const PLACEMENT_RE = /^\[nopal-image\]\[(\d+)\]$|^\[(\d+)\]$/;

const LONG_PRESS_MS = 250;

// ── SVG data URIs ────────────────────────────────────────────────────────────

const FILE_ICON_URI = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36" fill="none"><circle cx="18" cy="18" r="18" fill="#a78bfa"/><path d="M13 10h6l5 5v11a1 1 0 0 1-1 1H13a1 1 0 0 1-1-1V11a1 1 0 0 1 1-1z" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><polyline points="19 10 19 15 24 15" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
)}`;

const TRAY_LOADING_URI = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="11" fill="none" stroke="#e0daea" stroke-width="2"/><path d="M14 3 A11 11 0 0 1 25 14" fill="none" stroke="#a78bfa" stroke-width="2.5" stroke-linecap="round"><animateTransform attributeName="transform" type="rotate" from="0 14 14" to="360 14 14" dur="0.85s" repeatCount="indefinite"/></path></svg>`,
)}`;

const TRAY_FILE_URI = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#a78bfa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3H8a2 2 0 0 0-2 2v18a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="16 3 16 9 22 9"/></svg>`,
)}`;

// ── URL-embed helpers ────────────────────────────────────────────────────────

const BARE_URL_RE = /^https?:\/\/\S+$/i;
const YOUTUBE_RE =
  /(?:youtube\.com\/(?:watch\?(?:.*?&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
const VIMEO_RE = /vimeo\.com\/(?:video\/)?(\d+)/;

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

// ── Types ────────────────────────────────────────────────────────────────────

export interface EditorHandle {
  insertMarkdown: (markdown: string) => void;
  addFiles: (files: File[]) => Promise<void>;
}

interface FileEntry {
  index: number;
  url: string | null;
  name: string;
  isImage: boolean;
  status: "uploading" | "ready";
}

interface ImagePlacement {
  fileIndex: number;
  afterParagraphIndex: number;
}

interface MdxEditorClientProps {
  markdown: string;
  onChange: (md: string) => void;
  uploadFile?: (file: File) => Promise<string>;
  onEditorReady?: (handle: EditorHandle) => void;
  placeholder?: string;
  trayButtons?: ReactNode;
}

/** State tracked while a touch drag is in progress. */
interface TouchDragState {
  /** Whether the item came from the tray or is a placed chip. */
  type: "tray" | "chip";
  fileIndex: number;
  startX: number;
  startY: number;
  /** Long-press timer handle; null once it has fired. */
  timer: ReturnType<typeof setTimeout> | null;
  /** Becomes true once the long-press delay has elapsed and the drag is live. */
  active: boolean;
}

// ── Document parsing / serialization ─────────────────────────────────────────

function parseDocument(raw: string): {
  userContent: string;
  files: FileEntry[];
} {
  const idx = raw.indexOf(NOPAL_MARKER);
  if (idx === -1) return { userContent: raw, files: [] };

  const userContent = raw.slice(0, idx);
  const registrySection = raw.slice(idx + NOPAL_MARKER.length);
  const files: FileEntry[] = [];

  for (const line of registrySection.split("\n")) {
    const m = line.match(FILE_LINE_RE);
    if (!m) continue;
    const index = parseInt(m[1]);
    const value = m[2].trim();
    const isUrl = value.startsWith("http");
    files.push({
      index,
      url: isUrl ? value : null,
      name: value,
      isImage: isUrl ? IMAGE_EXT.test(value) : false,
      status: isUrl ? "ready" : "uploading",
    });
  }

  return { userContent, files };
}

function serializeDocument(userContent: string, files: FileEntry[]): string {
  if (files.length === 0) return userContent;
  const lines = files.map((f) => `[${f.index}] ${f.url ?? f.name}`);
  return `${userContent.trimEnd()}${NOPAL_MARKER}\n${lines.join("\n")}`;
}

function parseUserContent(content: string): {
  editorText: string;
  placements: ImagePlacement[];
} {
  const paras = content.split("\n\n");
  const clean: string[] = [];
  const placements: ImagePlacement[] = [];

  for (const para of paras) {
    const m = para.trim().match(PLACEMENT_RE);
    if (m) {
      placements.push({
        fileIndex: parseInt(m[1] ?? m[2]),
        afterParagraphIndex: clean.length,
      });
    } else {
      clean.push(para);
    }
  }

  return { editorText: clean.join("\n\n"), placements };
}

function buildUserContent(
  editorText: string,
  placements: ImagePlacement[],
): string {
  const paras = editorText.split("\n\n").filter((p) => p.trim() !== "");
  const result = [...paras];

  const sorted = [...placements].sort(
    (a, b) => b.afterParagraphIndex - a.afterParagraphIndex,
  );
  for (const { fileIndex, afterParagraphIndex } of sorted) {
    result.splice(
      Math.min(afterParagraphIndex, result.length),
      0,
      `[nopal-image][${fileIndex}]`,
    );
  }

  return result.join("\n\n");
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function MdxEditorClient({
  markdown,
  onChange,
  uploadFile,
  onEditorReady,
  placeholder = "Write...",
  trayButtons,
}: MdxEditorClientProps) {
  const [initialState] = useState(() => {
    const { userContent, files } = parseDocument(markdown);
    const { editorText, placements } = parseUserContent(userContent);
    const nextIndex =
      files.length > 0 ? Math.max(...files.map((f) => f.index)) + 1 : 1;
    return { editorText, placements, files, nextIndex };
  });

  const [files, setFiles] = useState<FileEntry[]>(initialState.files);
  const [editorText, setEditorText] = useState<string>(initialState.editorText);
  const [placements, setPlacements] = useState<ImagePlacement[]>(
    initialState.placements,
  );
  const [chipPositions, setChipPositions] = useState<
    Array<{ fileIndex: number; y: number }>
  >([]);
  const [expandedGroupKey, setExpandedGroupKey] = useState<number | null>(null);
  const [isPreview, setIsPreview] = useState(false);

  const nextIndexRef = useRef(initialState.nextIndex);
  const filesRef = useRef<FileEntry[]>(initialState.files);
  const editorTextRef = useRef(initialState.editorText);
  const placementsRef = useRef<ImagePlacement[]>(initialState.placements);
  /** Tracks the snap-point index chosen by the last dragover / touchmove event. */
  const snappedBlocksAboveRef = useRef<number>(0);
  /** Always holds the latest addFilesCore so the stable EditorHandle can call it. */
  const addFilesCoreRef = useRef<(files: File[]) => Promise<void>>(
    async () => {},
  );

  const editorRef = useRef<MDXEditorMethods>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const editorBodyRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);

  // ── Touch-drag refs ─────────────────────────────────────────────────────
  /** Live state for an in-progress touch drag; null when idle. */
  const touchDragRef = useRef<TouchDragState | null>(null);
  /** The floating ghost element that follows the user's finger. */
  const touchGhostRef = useRef<HTMLDivElement | null>(null);
  /** Reference to the tray element — used to detect drop-back-on-tray. */
  const trayRef = useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [dotY, setDotY] = useState(0);

  // ── Keep refs in sync ───────────────────────────────────────────────────
  useEffect(() => {
    filesRef.current = files;
  }, [files]);
  useEffect(() => {
    editorTextRef.current = editorText;
  }, [editorText]);
  useEffect(() => {
    placementsRef.current = placements;
  }, [placements]);

  // ── Notify parent ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    const userContent = buildUserContent(editorText, placements);
    onChange(serializeDocument(userContent, files));
  }, [editorText, placements, files, onChange]);

  // ── Core upload logic (used by + button and exposed EditorHandle) ───────
  const addFilesCore = useCallback(
    async (fileList: File[]) => {
      if (!fileList.length || !uploadFile) return;

      const startIndex = nextIndexRef.current;
      nextIndexRef.current += fileList.length;

      const placeholders: FileEntry[] = fileList.map((file, i) => ({
        index: startIndex + i,
        url: null,
        name:
          fileList.length === 1
            ? `Uploading ${file.name}…`
            : `Uploading ${i + 1} of ${fileList.length}…`,
        isImage: IMAGE_MIME.test(file.type) || IMAGE_EXT.test(file.name),
        status: "uploading" as const,
      }));

      setFiles((prev) => {
        const updated = [...prev, ...placeholders];
        filesRef.current = updated;
        return updated;
      });

      await Promise.all(
        fileList.map(async (file, i) => {
          try {
            const url = await uploadFile(file);
            const isImage =
              IMAGE_MIME.test(file.type) || IMAGE_EXT.test(file.name);
            setFiles((prev) => {
              const updated = prev.map((f) =>
                f.index === startIndex + i
                  ? {
                      ...f,
                      url,
                      name: file.name,
                      isImage,
                      status: "ready" as const,
                    }
                  : f,
              );
              filesRef.current = updated;
              return updated;
            });
          } catch (err) {
            console.error("Upload error:", err);
          }
        }),
      );
    },
    [uploadFile],
  );

  useEffect(() => {
    addFilesCoreRef.current = addFilesCore;
  }, [addFilesCore]);

  // ── Expose imperative handle ────────────────────────────────────────────
  useEffect(() => {
    if (onEditorReady) {
      onEditorReady({
        insertMarkdown: (md: string) => editorRef.current?.insertMarkdown(md),
        addFiles: (files: File[]) => addFilesCoreRef.current(files),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Shared snap-point computation (mouse drag + touch drag) ────────────
  /**
   * Given a viewport clientY, finds the nearest paragraph-gap snap point
   * within the editor content, updates the dot indicator, and stores the
   * block-above index for use when the drop is committed.
   */
  const computeAndSetSnapPoint = useCallback((clientY: number) => {
    const containerRect = editorContainerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    const bodyEl = editorBodyRef.current;
    const contentEl = bodyEl?.querySelector('[contenteditable="true"]');
    const blocks = contentEl
      ? (Array.from(contentEl.children) as HTMLElement[])
      : [];

    const rawY = clientY - containerRect.top;

    if (blocks.length === 0) {
      setDotY(Math.max(0, Math.min(rawY, containerRect.height)));
      snappedBlocksAboveRef.current = 0;
      return;
    }

    // Build N+1 snap points: before block 0, between each adjacent pair,
    // and after the last block.
    const snapPoints: number[] = [];
    snapPoints.push(blocks[0].getBoundingClientRect().top - containerRect.top);
    for (let i = 0; i < blocks.length - 1; i++) {
      const b = blocks[i].getBoundingClientRect().bottom - containerRect.top;
      const t = blocks[i + 1].getBoundingClientRect().top - containerRect.top;
      snapPoints.push((b + t) / 2);
    }
    snapPoints.push(
      blocks[blocks.length - 1].getBoundingClientRect().bottom -
        containerRect.top,
    );

    let bestIdx = 0;
    let bestDist = Math.abs(snapPoints[0] - rawY);
    for (let i = 1; i < snapPoints.length; i++) {
      const d = Math.abs(snapPoints[i] - rawY);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }

    setDotY(snapPoints[bestIdx]);
    snappedBlocksAboveRef.current = bestIdx;
  }, []);

  // ── Shared drop-commit logic (mouse drag + touch drag) ─────────────────
  /**
   * Converts the current snapped block index into a paragraph position and
   * either adds a new placement (from tray) or moves an existing one (chip).
   */
  const performDrop = useCallback(
    (isReposition: boolean, fileIndex: number) => {
      const blocksAbove = snappedBlocksAboveRef.current;

      const bodyEl = editorBodyRef.current;
      const contentEl = bodyEl?.querySelector('[contenteditable="true"]');
      const totalBlocks = contentEl ? contentEl.children.length : 0;

      const text = editorTextRef.current;
      const paragraphs = text.split("\n\n").filter((p) => p.trim() !== "");
      const afterParagraphIndex =
        totalBlocks > 0
          ? Math.min(
              Math.round((blocksAbove / totalBlocks) * paragraphs.length),
              paragraphs.length,
            )
          : paragraphs.length;

      if (isReposition) {
        setPlacements((prev) => [
          ...prev.filter((p) => p.fileIndex !== fileIndex),
          { fileIndex, afterParagraphIndex },
        ]);
      } else {
        setPlacements((prev) => [...prev, { fileIndex, afterParagraphIndex }]);
      }
    },
    [],
  );

  // ── Touch ghost helpers ─────────────────────────────────────────────────

  /** Creates a fixed-position ghost element that follows the user's finger. */
  const createTouchGhost = useCallback(
    (fileIndex: number, clientX: number, clientY: number) => {
      if (touchGhostRef.current) return; // already created

      const file = filesRef.current.find((f) => f.index === fileIndex);

      const ghost = document.createElement("div");
      ghost.style.cssText = [
        "position: fixed",
        "width: 52px",
        "height: 52px",
        "border-radius: 50%",
        "overflow: hidden",
        "box-shadow: 0 6px 24px rgba(0,0,0,0.35), 0 0 0 3px rgba(167,139,250,0.85)",
        "opacity: 0.9",
        "pointer-events: none",
        "z-index: 10000",
        `left: ${clientX - 26}px`,
        `top: ${clientY - 65}px`,
        "will-change: left, top",
        "transition: none",
      ].join("; ");

      const img = document.createElement("img");
      img.src = file?.isImage && file.url ? file.url : FILE_ICON_URI;
      img.style.cssText =
        "width: 100%; height: 100%; object-fit: cover; display: block;";
      ghost.appendChild(img);

      document.body.appendChild(ghost);
      touchGhostRef.current = ghost as HTMLDivElement;
    },
    [],
  );

  /** Removes the ghost element from the DOM. */
  const destroyTouchGhost = useCallback(() => {
    const ghost = touchGhostRef.current;
    if (ghost?.parentNode) {
      ghost.parentNode.removeChild(ghost);
      touchGhostRef.current = null;
    }
  }, []);

  // ── Global mouse dragover tracking ─────────────────────────────────────
  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: DragEvent) => computeAndSetSnapPoint(e.clientY);
    document.addEventListener("dragover", onMove);
    return () => document.removeEventListener("dragover", onMove);
  }, [isDragging, computeAndSetSnapPoint]);

  // ── Chip position computation ───────────────────────────────────────────
  useLayoutEffect(() => {
    if (isPreview) return; // positions are not needed in preview mode
    const containerEl = editorContainerRef.current;
    const bodyEl = editorBodyRef.current;
    const contentEl = bodyEl?.querySelector('[contenteditable="true"]');
    if (!containerEl || !contentEl) return;

    const blocks = Array.from(contentEl.children) as HTMLElement[];
    const containerRect = containerEl.getBoundingClientRect();

    const positions = placements.map(({ fileIndex, afterParagraphIndex }) => {
      const prev = blocks[afterParagraphIndex - 1];
      const next = blocks[afterParagraphIndex];
      let y: number;

      if (prev && next) {
        y =
          (prev.getBoundingClientRect().bottom +
            next.getBoundingClientRect().top) /
            2 -
          containerRect.top;
      } else if (prev) {
        y = prev.getBoundingClientRect().bottom - containerRect.top + 14;
      } else if (next) {
        y = next.getBoundingClientRect().top - containerRect.top - 14;
      } else {
        y = 36;
      }

      return { fileIndex, y };
    });

    setChipPositions(positions);
  }, [placements, editorText, isPreview]);

  // ── Derived state ───────────────────────────────────────────────────────

  const placedIndices = useMemo(
    () => new Set(placements.map((p) => p.fileIndex)),
    [placements],
  );

  const trayFiles = useMemo(
    () => files.filter((f) => !placedIndices.has(f.index)),
    [files, placedIndices],
  );

  const chipGroups = useMemo(() => {
    const sorted = [...chipPositions].sort((a, b) => a.y - b.y);
    const groups: Array<{
      key: number;
      baseY: number;
      chips: Array<{ fileIndex: number; y: number }>;
    }> = [];

    for (const chip of sorted) {
      const last = groups[groups.length - 1];
      if (last && chip.y - last.baseY < STACK_THRESHOLD) {
        last.chips.push(chip);
      } else {
        groups.push({ key: chip.fileIndex, baseY: chip.y, chips: [chip] });
      }
    }
    return groups;
  }, [chipPositions]);

  // ── Preview content ─────────────────────────────────────────────────────
  /**
   * Builds the full merged markdown string for the preview using the shared
   * buildDisplayMarkdown utility — same logic used by PastLogEntry so both
   * views are always consistent.
   * When not in preview mode we return "" to avoid unnecessary work.
   */
  const previewMarkdown = useMemo(
    () =>
      isPreview ? buildDisplayMarkdown(editorText, placements, files) : "",
    [isPreview, editorText, placements, files],
  );

  // useMarkdown must be called unconditionally (Rules of Hooks).
  // When isPreview is false, previewMarkdown is "" so the hook is a no-op.
  const previewElement = useMarkdown(previewMarkdown);

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const fileList = Array.from(e.target.files ?? []);
      e.target.value = "";
      await addFilesCore(fileList);
    },
    [addFilesCore],
  );

  // ── Mouse drag handlers ─────────────────────────────────────────────────

  const handleTrayDragStart = useCallback(
    (e: React.DragEvent, index: number) => {
      e.dataTransfer.setData("application/x-nopal-file-index", String(index));
      e.dataTransfer.effectAllowed = "copy";
      setIsDragging(true);
    },
    [],
  );

  const handleTrayDragEnd = useCallback(() => setIsDragging(false), []);

  const handleDropLineDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      const { types } = e.dataTransfer;
      const isChip = types.includes("application/x-nopal-chip-index");
      const isFile = types.includes("application/x-nopal-file-index");
      if (!isChip && !isFile) return;
      e.preventDefault();
      // dropEffect must match the drag source's effectAllowed:
      // tray items use "copy", chip repositions use "move"
      e.dataTransfer.dropEffect = isChip ? "move" : "copy";
    },
    [],
  );

  const handleDropLineDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      const chipIndexStr = e.dataTransfer.getData(
        "application/x-nopal-chip-index",
      );
      const fileIndexStr = e.dataTransfer.getData(
        "application/x-nopal-file-index",
      );
      if (!chipIndexStr && !fileIndexStr) return;
      e.preventDefault();

      const fileIndex = parseInt(chipIndexStr || fileIndexStr);
      const isReposition = !!chipIndexStr;
      setIsDragging(false);
      performDrop(isReposition, fileIndex);
    },
    [performDrop],
  );

  const handleRemovePlacement = useCallback((fileIndex: number) => {
    setPlacements((prev) => prev.filter((p) => p.fileIndex !== fileIndex));
  }, []);

  const handleChipDragStart = useCallback(
    (e: React.DragEvent, fileIndex: number) => {
      e.dataTransfer.setData(
        "application/x-nopal-chip-index",
        String(fileIndex),
      );
      e.dataTransfer.effectAllowed = "move";
      setExpandedGroupKey(null);
      setIsDragging(true);
    },
    [],
  );

  const handleChipDragEnd = useCallback(() => setIsDragging(false), []);

  const handleTrayChipDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      if (e.dataTransfer.types.includes("application/x-nopal-chip-index")) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      }
    },
    [],
  );

  const handleTrayChipDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      const indexStr = e.dataTransfer.getData("application/x-nopal-chip-index");
      if (!indexStr) return;
      e.preventDefault();
      handleRemovePlacement(parseInt(indexStr));
    },
    [handleRemovePlacement],
  );

  // ── Global touch tracking (always-on, checks ref before acting) ────────
  /**
   * Registers document-level touch listeners once on mount.
   *
   * - touchmove: cancels the long-press timer if the finger moves before it
   *   fires (so normal page scrolling still works); once a drag IS active it
   *   prevents scroll and updates the ghost + snap dot.
   * - touchend: commits the drop (or removes a chip placement if dropped on
   *   the tray), then cleans up.
   * - touchcancel: cancels the whole operation cleanly.
   *
   * Using { passive: false } on touchmove is required so we can call
   * preventDefault() during an active drag.
   */
  useEffect(() => {
    const onTouchMove = (e: TouchEvent) => {
      const state = touchDragRef.current;
      if (!state) return;

      const touch = e.touches[0];

      if (!state.active) {
        // Not yet dragging — cancel the long-press if the finger moved
        // enough that the user is clearly trying to scroll.
        const dx = touch.clientX - state.startX;
        const dy = touch.clientY - state.startY;
        if (Math.sqrt(dx * dx + dy * dy) > 8) {
          if (state.timer) clearTimeout(state.timer);
          touchDragRef.current = null;
        }
        return;
      }

      // Active drag — prevent the browser from scrolling under the finger.
      e.preventDefault();

      // Move the ghost to follow the fingertip (offset upward so the chip
      // is visible above the finger).
      const ghost = touchGhostRef.current;
      if (ghost) {
        ghost.style.left = `${touch.clientX - 26}px`;
        ghost.style.top = `${touch.clientY - 65}px`;
      }

      computeAndSetSnapPoint(touch.clientY);
    };

    const onTouchEnd = (e: TouchEvent) => {
      const state = touchDragRef.current;
      if (!state) return;

      if (state.timer) clearTimeout(state.timer);

      if (!state.active) {
        // Long-press never fired — this was just a tap; let click handle it.
        touchDragRef.current = null;
        return;
      }

      const touch = e.changedTouches[0];

      // Determine whether the finger lifted over the tray.
      const trayRect = trayRef.current?.getBoundingClientRect();
      const isOverTray =
        !!trayRect &&
        touch.clientX >= trayRect.left &&
        touch.clientX <= trayRect.right &&
        touch.clientY >= trayRect.top &&
        touch.clientY <= trayRect.bottom;

      if (state.type === "chip" && isOverTray) {
        // Dragging a placed chip back onto the tray removes the placement.
        handleRemovePlacement(state.fileIndex);
      } else if (!(state.type === "tray" && isOverTray)) {
        // Place (or reposition) in the editor, unless the user dragged a
        // tray item and dropped it back on the tray (i.e. they changed
        // their mind — in that case we do nothing).
        performDrop(state.type === "chip", state.fileIndex);
      }

      destroyTouchGhost();
      touchDragRef.current = null;
      setIsDragging(false);
    };

    const onTouchCancel = () => {
      const state = touchDragRef.current;
      if (!state) return;
      if (state.timer) clearTimeout(state.timer);
      destroyTouchGhost();
      touchDragRef.current = null;
      setIsDragging(false);
    };

    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd);
    document.addEventListener("touchcancel", onTouchCancel);

    return () => {
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("touchcancel", onTouchCancel);
    };
    // All dependencies are stable (empty-dep useCallback / setState setters).
  }, [
    computeAndSetSnapPoint,
    destroyTouchGhost,
    handleRemovePlacement,
    performDrop,
  ]);

  // ── Touch drag handlers ─────────────────────────────────────────────────

  /**
   * Called on touchstart for a tray item.  Starts the long-press timer;
   * if it fires the item enters drag mode.  A small movement before the
   * timer fires cancels it so the user can still scroll the tray.
   */
  const handleTrayTouchStart = useCallback(
    (e: React.TouchEvent, fileIndex: number) => {
      const file = filesRef.current.find((f) => f.index === fileIndex);
      if (file?.status !== "ready") return;

      const touch = e.touches[0];
      const startX = touch.clientX;
      const startY = touch.clientY;

      const timer = setTimeout(() => {
        if (!touchDragRef.current) return;
        touchDragRef.current.active = true;
        setIsDragging(true);
        createTouchGhost(fileIndex, startX, startY);
        // Haptic feedback on devices that support it.
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate(25);
        }
      }, LONG_PRESS_MS);

      touchDragRef.current = {
        type: "tray",
        fileIndex,
        startX,
        startY,
        timer,
        active: false,
      };
    },
    [createTouchGhost],
  );

  /**
   * Called on touchstart for a placed-file chip.  Same long-press pattern
   * as the tray, but also collapses any expanded group before dragging.
   */
  const handleChipTouchStart = useCallback(
    (e: React.TouchEvent, fileIndex: number) => {
      const touch = e.touches[0];
      const startX = touch.clientX;
      const startY = touch.clientY;

      const timer = setTimeout(() => {
        if (!touchDragRef.current) return;
        touchDragRef.current.active = true;
        setExpandedGroupKey(null);
        setIsDragging(true);
        createTouchGhost(fileIndex, startX, startY);
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate(25);
        }
      }, LONG_PRESS_MS);

      touchDragRef.current = {
        type: "chip",
        fileIndex,
        startX,
        startY,
        timer,
        active: false,
      };
    },
    [createTouchGhost],
  );

  // ── Text / paste handlers ───────────────────────────────────────────────

  const handleUserContentChange = useCallback((newMd: string) => {
    setEditorText(newMd);
  }, []);

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    const text = e.clipboardData.getData("text/plain").trim();
    if (!BARE_URL_RE.test(text)) return;

    const editor = editorRef.current;
    if (!editor) return;

    const videoEmbed = buildVideoEmbed(text);
    if (videoEmbed) {
      e.preventDefault();
      editor.insertMarkdown(`\n\n${videoEmbed}\n\n`);
      return;
    }

    // All URLs (including image URLs) become markdown links.
    // imagePlugin is not used, so there is no in-editor image renderer.
    e.preventDefault();
    editor.insertMarkdown(`[${text}](${text})`);
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div
      ref={editorContainerRef}
      style={{ display: "flex", flexDirection: "column", position: "relative" }}
    >
      {/* Editor — always mounted so state is preserved; hidden in preview */}
      <div
        ref={editorBodyRef}
        onPaste={handlePaste}
        style={{ display: isPreview ? "none" : undefined }}
      >
        <MDXEditor
          ref={editorRef}
          markdown={initialState.editorText}
          onChange={handleUserContentChange}
          placeholder={placeholder}
          plugins={[
            headingsPlugin(),
            listsPlugin(),
            quotePlugin(),
            thematicBreakPlugin(),
            markdownShortcutPlugin(),
            linkPlugin(),
            linkDialogPlugin(),
          ]}
        />
      </div>

      {/* Preview — rendered via useMarkdown, same as the rest of the app */}
      {isPreview && <div className="nopal-preview">{previewElement}</div>}

      {/* Placed-file chips (edit mode only) */}
      {!isPreview &&
        chipGroups.map((group) => {
          const isStack = group.chips.length > 1;
          const isExpanded = expandedGroupKey === group.key;

          return group.chips.map((chip, i) => {
            const file = files.find((f) => f.index === chip.fileIndex);
            if (!file) return null;

            let chipY: number;
            let chipZIndex: number;

            if (!isStack) {
              chipY = chip.y;
              chipZIndex = 10;
            } else if (!isExpanded) {
              chipY = group.baseY + i * 5;
              chipZIndex = 10 + (group.chips.length - i);
            } else {
              const FAN_SPACING = 44;
              const totalSpan = (group.chips.length - 1) * FAN_SPACING;
              chipY = group.baseY - totalSpan / 2 + i * FAN_SPACING;
              chipZIndex = 10 + i;
            }

            const isTopOfCollapsedStack = isStack && !isExpanded && i === 0;

            return (
              <button
                key={chip.fileIndex}
                className={[
                  "nopal-image-chip",
                  isStack && !isExpanded ? "nopal-image-chip--stacked" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={{ top: chipY, zIndex: chipZIndex }}
                draggable
                onDragStart={(e) => handleChipDragStart(e, chip.fileIndex)}
                onDragEnd={handleChipDragEnd}
                onTouchStart={(e) => handleChipTouchStart(e, chip.fileIndex)}
                onClick={() => {
                  if (isStack && !isExpanded) {
                    setExpandedGroupKey(group.key);
                  } else if (isExpanded) {
                    setExpandedGroupKey(null);
                  }
                }}
                title={
                  isStack && !isExpanded
                    ? `${group.chips.length} items — click to expand`
                    : `[${chip.fileIndex}] ${file.name} — drag to tray to remove`
                }
              >
                {file.isImage && file.url ? (
                  <img src={file.url} alt={file.name} />
                ) : (
                  <img src={FILE_ICON_URI} alt={file.name} />
                )}
                <span className="nopal-image-chip-label">
                  [{chip.fileIndex}]
                </span>
                {isTopOfCollapsedStack && (
                  <span className="nopal-image-chip-stack-badge">
                    +{group.chips.length - 1}
                  </span>
                )}
              </button>
            );
          });
        })}

      {/* Drop-line: side strip + snapping dot + horizontal dashed guide */}
      {!isPreview && isDragging && (
        <>
          {/* Dashed horizontal guide — stretches from the left edge to the strip */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 48,
              top: dotY,
              height: 0,
              borderTop: "1.5px dashed rgba(167, 139, 250, 0.5)",
              transform: "translateY(-50%)",
              pointerEvents: "none",
              zIndex: 39,
            }}
          />

          {/* Drop strip */}
          <div
            onDragOver={handleDropLineDragOver}
            onDrop={handleDropLineDrop}
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              width: "48px",
              zIndex: 40,
              cursor: "copy",
            }}
          >
            {/* Vertical line */}
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: "50%",
                width: "2px",
                background: "var(--purple-light, #a78bfa)",
                transform: "translateX(-50%)",
                opacity: 0.8,
                pointerEvents: "none",
              }}
            />
            {/* Snapping dot */}
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: dotY,
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                background: "var(--purple-light, #a78bfa)",
                transform: "translate(-50%, -50%)",
                boxShadow: "0 2px 10px rgba(63,43,70,0.45)",
                pointerEvents: "none",
                transition: "top 0.08s ease",
              }}
            />
          </div>
        </>
      )}

      {/* Tray — always visible; preview toggle on left, file chips on right */}
      <div
        ref={trayRef}
        className="nopal-tray"
        onDragOver={
          uploadFile && !isPreview ? handleTrayChipDragOver : undefined
        }
        onDrop={uploadFile && !isPreview ? handleTrayChipDrop : undefined}
      >
        {/* Preview toggle — pinned to the left via auto right-margin */}
        <button
          className="nopal-preview-toggle"
          style={{ marginRight: "auto" }}
          onClick={() => setIsPreview((v) => !v)}
        >
          {isPreview ? "← edit" : "preview"}
        </button>

        {/* File chips + add button — edit mode + uploadFile only */}
        {uploadFile && !isPreview && (
          <>
            {trayFiles.map((file) => (
              <div
                key={file.index}
                className={[
                  "nopal-tray-item",
                  file.status === "uploading"
                    ? "nopal-tray-item--uploading"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                draggable={file.status === "ready"}
                onDragStart={
                  file.status === "ready"
                    ? (e) => handleTrayDragStart(e, file.index)
                    : undefined
                }
                onDragEnd={handleTrayDragEnd}
                onTouchStart={(e) => handleTrayTouchStart(e, file.index)}
                title={`[${file.index}] ${file.name}`}
              >
                {file.status === "uploading" ? (
                  <img
                    src={TRAY_LOADING_URI}
                    width={28}
                    height={28}
                    alt="uploading"
                    style={{ display: "block" }}
                  />
                ) : file.isImage && file.url ? (
                  <img
                    src={file.url}
                    alt={file.name}
                    className="nopal-tray-item-thumb"
                  />
                ) : (
                  <img
                    src={TRAY_FILE_URI}
                    width={28}
                    height={28}
                    alt={file.name}
                    style={{ display: "block" }}
                  />
                )}
                <span className="nopal-tray-item-badge">[{file.index}]</span>
              </div>
            ))}

            <button
              className="nopal-tray-add"
              onClick={() => fileInputRef.current?.click()}
              title="Attach photos or files"
            >
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
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
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

        {/* Extra buttons supplied by the parent — rendered after the + button */}
        {trayButtons}
      </div>
    </div>
  );
}
