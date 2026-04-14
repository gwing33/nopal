import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { redirect, useLoaderData, useFetcher } from "react-router";
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  lazy,
  Suspense,
} from "react";
import { getUser } from "../modules/auth/auth.server";
import { AppLayout } from "../components/AppLayout";
import {
  getDailyLogs,
  saveDailyLog,
  type DailyLog,
} from "../data/dailyLog.server";

// Lazy-load the MDX editor — client only, never runs on the server.
const MdxEditorClient = lazy(() => import("../components/MdxEditorClient"));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function localDateString(): string {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatEntryDate(dateStr: string, today: string): string {
  if (dateStr === today) return "Today";
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const [ty, tm, td] = today.split("-").map(Number);
  const todayDate = new Date(ty, tm - 1, td);
  const diff = Math.round((todayDate.getTime() - date.getTime()) / 86400000);
  if (diff === 1) return "Yesterday";
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getPreview(
  content: string,
  lineCount = 10,
): { preview: string; hasMore: boolean } {
  const lines = content.split("\n");
  if (lines.length <= lineCount) return { preview: content, hasMore: false };
  return { preview: lines.slice(0, lineCount).join("\n"), hasMore: true };
}

// ─── Loader ───────────────────────────────────────────────────────────────────

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (!user) return redirect("/login");
  // Load all entries newest-first; 500 is a generous ceiling for any user
  const { entries } = await getDailyLogs(user._id, { limit: 500 });
  return { user, entries };
}

// ─── Action ───────────────────────────────────────────────────────────────────

export async function action({ request }: ActionFunctionArgs) {
  const user = await getUser(request);
  if (!user) return { error: "Not authenticated" };

  const ct = request.headers.get("content-type") ?? "";
  let date: string, content: string;

  if (ct.includes("application/json")) {
    const body = await request.json();
    date = body.date;
    content = body.content;
  } else {
    const form = await request.formData();
    date = String(form.get("date") ?? "");
    content = String(form.get("content") ?? "");
  }

  if (!date || typeof content !== "string") return { error: "Invalid request" };
  const entry = await saveDailyLog(user._id, date, content);
  return { success: true, entry };
}

// ─── Static intro content ─────────────────────────────────────────────────────

const INTRO_CONTENT = `Welcome to your daily log. This is a quiet place to capture what you're working on, what you're thinking about, and what's happening on your projects.

I use mine to record:
— Decisions and why I made them
— Blockers I ran into
— Things I want to follow up on
— Small wins worth writing down

The format is loose. Some days a few sentences, other days a few paragraphs. There's no wrong way to do it. The goal is just to have a record.

Your log stays open all day based on your device's clock and saves automatically as you type. Scroll up to see past entries.

— Gerald`;

// ─── Shared expand button ─────────────────────────────────────────────────────

function ExpandButton({
  expanded,
  onToggle,
}: {
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      style={{
        fontSize: "0.8rem",
        color: "var(--purple-light)",
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "6px 0 0 0",
        fontFamily: "monospace",
        display: "block",
      }}
    >
      {expanded ? "Show less ↑" : "Show more ↓"}
    </button>
  );
}

// ─── AuthorIntroEntry ─────────────────────────────────────────────────────────

function AuthorIntroEntry() {
  const [expanded, setExpanded] = useState(false);
  const { preview, hasMore } = getPreview(INTRO_CONTENT, 10);

  return (
    <div
      style={{
        padding: "20px 24px",
        marginBottom: "12px",
        background: "var(--farground)",
        border: "1px dashed var(--midground)",
        borderRadius: "8px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "12px",
        }}
      >
        <span
          style={{
            fontFamily: "monospace",
            fontSize: "0.82rem",
            color: "var(--text-subtle)",
          }}
        >
          A note from the author
        </span>
        <span
          style={{
            background: "var(--yellow)",
            color: "var(--purple)",
            borderRadius: "4px",
            padding: "2px 6px",
            fontSize: "0.72rem",
            fontFamily: "monospace",
          }}
        >
          pinned
        </span>
      </div>
      <pre
        style={{
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          fontFamily: "inherit",
          fontSize: "0.93rem",
          lineHeight: "1.65",
          margin: "0",
          color: "var(--text-subtle)",
        }}
      >
        {expanded ? INTRO_CONTENT : preview}
      </pre>
      {hasMore && (
        <ExpandButton
          expanded={expanded}
          onToggle={() => setExpanded((e) => !e)}
        />
      )}
    </div>
  );
}

// ─── PastLogEntry ─────────────────────────────────────────────────────────────

function PastLogEntry({ entry, today }: { entry: DailyLog; today: string }) {
  const [expanded, setExpanded] = useState(false);
  const { preview, hasMore } = getPreview(entry.content, 10);

  return (
    <div
      className="good-box"
      style={{ padding: "20px 24px", marginBottom: "12px" }}
    >
      <div
        style={{
          fontFamily: "monospace",
          fontSize: "0.82rem",
          color: "var(--text-subtle)",
          marginBottom: "8px",
        }}
      >
        {formatEntryDate(entry.date, today)}
      </div>
      <pre
        style={{
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          fontFamily: "inherit",
          fontSize: "0.93rem",
          lineHeight: "1.65",
          margin: "0",
        }}
      >
        {expanded ? entry.content : preview}
      </pre>
      {hasMore && (
        <ExpandButton
          expanded={expanded}
          onToggle={() => setExpanded((e) => !e)}
        />
      )}
    </div>
  );
}

// ─── SaveIndicator ────────────────────────────────────────────────────────────

type SaveStatus = "idle" | "saving" | "saved" | "error";

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;

  const label =
    status === "saving"
      ? "Saving…"
      : status === "saved"
        ? "Saved"
        : "Save failed";

  const color =
    status === "saving"
      ? "var(--text-subtle)"
      : status === "saved"
        ? "var(--green)"
        : "var(--red)";

  return (
    <span
      style={{
        fontFamily: "monospace",
        fontSize: "0.75rem",
        color,
        transition: "color 200ms",
        flexShrink: 0,
      }}
    >
      {label}
    </span>
  );
}

// ─── TodayLogEntry ────────────────────────────────────────────────────────────

function TodayLogEntry({
  date,
  today,
  content,
  onChange,
  onBlur,
  saveStatus,
}: {
  date: string;
  today: string;
  content: string;
  onChange: (v: string) => void;
  onBlur: (v: string) => void;
  saveStatus: SaveStatus;
}) {
  const [isClient, setIsClient] = useState(false);
  const contentRef = useRef(content);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Keep contentRef in sync so the blur handler always sees the latest value
  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  // Build "Today — Monday, November 15, 2024"
  const [y, m, d] = date.split("-").map(Number);
  const fullDate = new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const dateLabel = formatEntryDate(date, today);
  const heading = dateLabel === "Today" ? `Today — ${fullDate}` : dateLabel;

  return (
    <div
      style={{
        marginBottom: "12px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          marginBottom: "4px",
        }}
      >
        <span
          className="purple-light-text"
          style={{
            fontFamily: "monospace",
            fontSize: "0.82rem",
            fontWeight: "bold",
          }}
        >
          {heading}
        </span>
        <SaveIndicator status={saveStatus} />
      </div>
      <div
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            onBlur(contentRef.current);
          }
        }}
        className="mdx-editor-wrapper"
      >
        {isClient ? (
          <Suspense
            fallback={
              <div
                style={{
                  fontFamily: "inherit",
                  fontSize: "0.95rem",
                  color: "var(--subtle-text)",
                  padding: "8px 0 0 0",
                }}
              >
                Loading editor…
              </div>
            }
          >
            <MdxEditorClient
              key={date}
              markdown={content}
              onChange={onChange}
            />
          </Suspense>
        ) : (
          <div
            style={{
              fontFamily: "inherit",
              fontSize: "0.95rem",
              color: "var(--subtle-text)",
              padding: "8px 0 0 0",
            }}
          >
            Loading editor…
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DailyLogPage() {
  const { user, entries: serverEntries } = useLoaderData<typeof loader>();

  // ── today + todayContent ──────────────────────────────────────────────────
  // Both start as "" so the server render and the initial client render
  // produce identical output (no hydration mismatch). The real device date
  // and localStorage content are read in a single useEffect after hydration.

  const [today, setToday] = useState("");
  const [todayContent, setTodayContent] = useState("");

  useEffect(() => {
    const d = localDateString();
    setToday(d);

    const lsKey = `nopal:daily-log:${user._id}:${d}`;
    try {
      const raw = localStorage.getItem(lsKey);
      if (raw !== null) {
        setTodayContent(JSON.parse(raw) as string);
      } else {
        // No localStorage copy — fall back to whatever the server has saved
        const serverEntry = serverEntries.find((e) => e.date === d);
        if (serverEntry?.content) setTodayContent(serverEntry.content);
      }
    } catch {
      // Ignore storage / parse errors
    }
  }, []); // intentionally empty — run exactly once after hydration

  // ── Derived values (gated on today being resolved) ───────────────────────

  // While today === "" all entries render as past entries on the server;
  // after hydration the correct split is applied.
  const pastEntries = today
    ? serverEntries
        .filter((e) => e.date !== today)
        .slice()
        .reverse()
    : [];

  // ── Server save ───────────────────────────────────────────────────────────

  const saveFetcher = useFetcher<typeof action>();
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveNow = useCallback(
    (content: string) => {
      if (!today) return;
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      saveFetcher.submit(
        { date: today, content },
        {
          method: "POST",
          action: "/fruits/daily-log",
          encType: "application/json",
        },
      );
    },
    [today, saveFetcher],
  );

  // Debounce: wait 30 s of inactivity before hitting the server
  const scheduleSave = useCallback(
    (content: string) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => saveNow(content), 30_000);
    },
    [saveNow],
  );

  // Cancel any pending debounce on unmount
  useEffect(
    () => () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    },
    [],
  );

  const handleChange = useCallback(
    (content: string) => {
      setTodayContent(content);
      // Persist to localStorage immediately
      if (today) {
        try {
          localStorage.setItem(
            `nopal:daily-log:${user._id}:${today}`,
            JSON.stringify(content),
          );
        } catch {
          // Ignore quota / access errors
        }
      }
      scheduleSave(content);
    },
    [today, user._id, scheduleSave],
  );

  // Blur triggers an immediate save so switching tabs never loses work
  const handleBlur = useCallback(
    (content: string) => saveNow(content),
    [saveNow],
  );

  // ── Save status ───────────────────────────────────────────────────────────

  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  useEffect(() => {
    if (saveFetcher.state === "submitting") {
      setSaveStatus("saving");
      return;
    }
    if (saveFetcher.state === "idle" && saveFetcher.data) {
      if ((saveFetcher.data as { error?: string }).error) {
        setSaveStatus("error");
        return;
      }
      setSaveStatus("saved");
      const t = setTimeout(() => setSaveStatus("idle"), 2500);
      return () => clearTimeout(t);
    }
  }, [saveFetcher.state, saveFetcher.data]);

  // ── Scroll to bottom once today resolves (past entries are now rendered) ──

  const bottomRef = useRef<HTMLDivElement>(null);
  const hasScrolledRef = useRef(false);

  useEffect(() => {
    if (!today || hasScrolledRef.current) return;
    hasScrolledRef.current = true;
    bottomRef.current?.scrollIntoView({
      behavior: "instant" as ScrollBehavior,
    });
  }, [today]); // fires when today transitions from "" to the real date

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <AppLayout>
      <div
        style={{
          padding: "32px 16px 80px",
          maxWidth: "680px",
          margin: "0 auto",
        }}
      >
        <AuthorIntroEntry />

        {/* Past entries: oldest at top, newest just above today */}
        {pastEntries.map((entry) => (
          <PastLogEntry key={entry.date} entry={entry} today={today} />
        ))}

        {/* Today's editable entry */}
        <TodayLogEntry
          date={today}
          today={today}
          content={todayContent}
          onChange={handleChange}
          onBlur={handleBlur}
          saveStatus={saveStatus}
        />

        {/* Invisible anchor scrolled into view once today resolves */}
        <div ref={bottomRef} />
      </div>
    </AppLayout>
  );
}
