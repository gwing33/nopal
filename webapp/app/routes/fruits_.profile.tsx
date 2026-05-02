import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { redirect, useLoaderData, useFetcher, Link } from "react-router";
import { useState, useRef, useEffect } from "react";
import { getUser } from "../modules/auth/auth.server";
import {
  getHumanById,
  patchHuman,
  DEFAULT_OFFICE_HOURS,
  type OfficeHours,
  type ScheduledEvent,
} from "../data/humans.server";
import { AppLayout } from "../components/AppLayout";

// ─── Loader ──────────────────────────────────────────────────────────────────

export async function loader({ request }: LoaderFunctionArgs) {
  const sessionUser = await getUser(request);
  if (!sessionUser) return redirect("/login");
  const user = (await getHumanById(sessionUser._id)) ?? sessionUser;
  return { user };
}

// ─── Action ──────────────────────────────────────────────────────────────────

export async function action({ request }: ActionFunctionArgs) {
  const user = await getUser(request);
  if (!user) return redirect("/login");

  const form = await request.formData();
  const intent = form.get("intent") as string;

  if (intent === "update-profile") {
    const name = (form.get("name") as string | null)?.trim();
    if (!name) return { error: "Name cannot be empty." };
    await patchHuman(user._id, { name });
    return { ok: true };
  }

  if (intent === "update-pfp") {
    const pfp = form.get("pfp") as string;
    await patchHuman(user._id, { pfp });
    return { ok: true };
  }

  if (intent === "update-office-hours") {
    const raw = form.get("officeHours") as string;
    const officeHours: OfficeHours = JSON.parse(raw);
    await patchHuman(user._id, { officeHours });
    return { ok: true };
  }

  if (intent === "add-event") {
    const name = (form.get("name") as string | null)?.trim();
    const startDate = form.get("startDate") as string;
    const endDate = form.get("endDate") as string;

    if (!name || !startDate || !endDate) {
      return { error: "All fields are required." };
    }
    const today = new Date().toISOString().split("T")[0];
    if (startDate < today) {
      return { error: "Start date must be today or in the future." };
    }
    if (endDate < startDate) {
      return { error: "End date must be on or after the start date." };
    }

    const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    const fresh = await getHumanById(user._id);
    const events: ScheduledEvent[] = [...(fresh?.scheduledEvents ?? [])];
    events.push({ id, name, startDate, endDate });
    await patchHuman(user._id, { scheduledEvents: events });
    return { ok: true };
  }

  if (intent === "remove-event") {
    const eventId = form.get("eventId") as string;
    const fresh = await getHumanById(user._id);
    const events = (fresh?.scheduledEvents ?? []).filter(
      (e) => e.id !== eventId,
    );
    await patchHuman(user._id, { scheduledEvents: events });
    return { ok: true };
  }

  return { error: "Unknown intent." };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;
type Day = (typeof DAYS)[number];

function formatDateRange(start: string, end: string): string {
  const s = new Date(start + "T12:00:00");
  const e = new Date(end + "T12:00:00");
  const short = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const long = (d: Date) =>
    d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  if (start === end) return long(s);
  return `${short(s)} – ${long(e)}`;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({
  pfp,
  name,
  email,
  size,
}: {
  pfp?: string;
  name: string;
  email: string;
  size: number;
}) {
  const initial = (name || email || "?")[0].toUpperCase();
  const fontSize = size >= 120 ? "3rem" : size >= 60 ? "2rem" : "1rem";

  if (pfp) {
    return (
      <img
        src={pfp}
        alt=""
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
          display: "block",
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "var(--purple-light)",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {initial}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user } = useLoaderData<typeof loader>();
  const todayStr = new Date().toISOString().split("T")[0];

  // ── Shared styles ───────────────────────────────────────────────────────────
  const btnPrimary: React.CSSProperties = {
    background: "var(--purple)",
    border: "none",
    borderRadius: "6px",
    padding: "8px 18px",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontFamily: "monospace",
    color: "white",
  };

  const btnSecondary: React.CSSProperties = {
    background: "none",
    border: "1px solid var(--foreground)",
    borderRadius: "6px",
    padding: "8px 14px",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontFamily: "monospace",
    color: "var(--text-subtle)",
  };

  const inputStyle: React.CSSProperties = {
    padding: "6px 10px",
    borderRadius: "6px",
    border: "1px solid var(--foreground)",
    background: "var(--farground)",
    color: "inherit",
    fontFamily: "inherit",
    fontSize: "0.9rem",
  };

  const sectionHeading: React.CSSProperties = {
    marginBottom: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
  };

  // ── PFP crop state ──────────────────────────────────────────────────────────
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [imgPos, setImgPos] = useState({ x: 0, y: 0 });
  const [imgScale, setImgScale] = useState(1);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragState = useRef<{
    startX: number;
    startY: number;
    startImgX: number;
    startImgY: number;
  } | null>(null);

  const pfpFetcher = useFetcher<{ ok?: boolean; error?: string }>();

  // Revoke object URL when imgSrc changes or on unmount
  useEffect(() => {
    return () => {
      if (imgSrc) URL.revokeObjectURL(imgSrc);
    };
  }, [imgSrc]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgSrc((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setCropFile(file);
    setImgScale(1);
    setImgPos({ x: 0, y: 0 });
    // Reset file input so the same file can be chosen again
    e.target.value = "";
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      startImgX: imgPos.x,
      startImgY: imgPos.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    setImgPos({
      x: dragState.current.startImgX + dx,
      y: dragState.current.startImgY + dy,
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    dragState.current = null;
  };

  const handleUpload = async () => {
    if (!imgSrc) return;
    setUploading(true);

    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setUploading(false);
      return;
    }

    const img = new Image();
    img.src = imgSrc;
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
    });

    // The image is rendered at its natural size in the container, then CSS-scaled.
    // So: container_px / imgScale = natural image px.
    const srcX = (40 - imgPos.x) / imgScale;
    const srcY = (40 - imgPos.y) / imgScale;
    const srcW = 240 / imgScale;
    const srcH = 240 / imgScale;
    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, 256, 256);

    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          setUploading(false);
          return;
        }
        const fd = new FormData();
        fd.append("file", blob);
        fd.append("type", "pfp");
        try {
          const res = await fetch("/api/upload", { method: "POST", body: fd });
          const data = await res.json();
          if (data.url) {
            pfpFetcher.submit(
              { intent: "update-pfp", pfp: data.url },
              { method: "POST", action: "/fruits/profile" },
            );
          }
          setCropFile(null);
          setImgSrc(null);
        } catch (err) {
          console.error("PFP upload error:", err);
        } finally {
          setUploading(false);
        }
      },
      "image/jpeg",
      0.92,
    );
  };

  // ── Name edit state ─────────────────────────────────────────────────────────
  const [editing, setEditing] = useState(false);
  const [nameValue, setNameValue] = useState(user.name);
  const nameFetcher = useFetcher<{ ok?: boolean; error?: string }>();

  useEffect(() => {
    if (nameFetcher.state === "idle" && nameFetcher.data?.ok) {
      setEditing(false);
    }
  }, [nameFetcher.state, nameFetcher.data]);

  // ── Office hours state ──────────────────────────────────────────────────────
  const [localOH, setLocalOH] = useState<OfficeHours>(
    user.officeHours ?? DEFAULT_OFFICE_HOURS,
  );
  const ohFetcher = useFetcher<{ ok?: boolean; error?: string }>();

  const updateDay = (
    day: Day,
    updates: Partial<{ enabled: boolean; start: string; end: string }>,
  ) => {
    setLocalOH((prev) => ({
      ...prev,
      [day]: { ...prev[day], ...updates },
    }));
  };

  // ── Scheduled events ────────────────────────────────────────────────────────
  const addFetcher = useFetcher<{ ok?: boolean; error?: string }>();
  const removeFetcher = useFetcher<{ ok?: boolean; error?: string }>();

  // Reset add-event form on success using a key
  const [addFormKey, setAddFormKey] = useState(0);
  useEffect(() => {
    if (addFetcher.state === "idle" && addFetcher.data?.ok) {
      setAddFormKey((k) => k + 1);
    }
  }, [addFetcher.state, addFetcher.data]);

  const visibleEvents = (user.scheduledEvents ?? [])
    .filter((e) => e.endDate >= todayStr)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <AppLayout>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "48px 24px" }}>

        {/* ━━━ Section 1: Profile Header ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            marginBottom: "48px",
          }}
        >
          <Avatar pfp={user.pfp} name={user.name} email={user.email} size={80} />
          <div>
            <div
              style={{ fontWeight: 700, fontSize: "1.5rem", marginBottom: "3px" }}
            >
              {user.name}
            </div>
            <div
              className="subtle-text"
              style={{ fontSize: "0.9rem", marginBottom: "8px" }}
            >
              {user.email}
            </div>
            <span
              className="text-xs font-mono"
              style={{
                background: "var(--midground)",
                padding: "2px 8px",
                borderRadius: "4px",
              }}
            >
              {user.role}
            </span>
          </div>
        </div>

        {/* ━━━ Section 2: Profile Picture ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div style={{ marginBottom: "40px" }}>
          <h2
            className="text-xs font-mono subtle-text"
            style={sectionHeading}
          >
            Profile Picture
          </h2>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: "16px",
            }}
          >
            {!cropFile && (
              <>
                <Avatar
                  pfp={user.pfp}
                  name={user.name}
                  email={user.email}
                  size={160}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    ...btnSecondary,
                    color: "var(--purple-light)",
                  }}
                >
                  Change Photo
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
              </>
            )}

            {cropFile && imgSrc && (
              <div>
                {/* Crop container */}
                <div
                  style={{
                    width: 320,
                    height: 320,
                    overflow: "hidden",
                    borderRadius: "8px",
                    border: "1px solid var(--foreground)",
                    position: "relative",
                    cursor: "grab",
                    background: "#000",
                    touchAction: "none",
                    userSelect: "none",
                  }}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                >
                  {/* Image at natural size, scaled and translated via CSS transform */}
                  <img
                    src={imgSrc}
                    alt=""
                    draggable={false}
                    style={{
                      position: "absolute",
                      transformOrigin: "0 0",
                      transform: `translate(${imgPos.x}px, ${imgPos.y}px) scale(${imgScale})`,
                      userSelect: "none",
                      pointerEvents: "none",
                    }}
                  />
                  {/* Dark overlay with 240×240 circular cutout, centered at (40,40) */}
                  <div
                    style={{
                      position: "absolute",
                      left: 40,
                      top: 40,
                      width: 240,
                      height: 240,
                      borderRadius: "50%",
                      boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
                      pointerEvents: "none",
                    }}
                  />
                  {/* Drag hint */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: 8,
                      left: 0,
                      right: 0,
                      textAlign: "center",
                      fontSize: "0.7rem",
                      color: "rgba(255,255,255,0.5)",
                      pointerEvents: "none",
                      userSelect: "none",
                    }}
                  >
                    drag to position
                  </div>
                </div>

                {/* Zoom slider */}
                <div style={{ marginTop: "14px", marginBottom: "16px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.7rem",
                      fontFamily: "monospace",
                      color: "var(--text-subtle)",
                      marginBottom: "6px",
                    }}
                  >
                    Zoom
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.01}
                    value={imgScale}
                    onChange={(e) => setImgScale(parseFloat(e.target.value))}
                    style={{ width: "320px" }}
                  />
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    style={{
                      ...btnPrimary,
                      opacity: uploading ? 0.6 : 1,
                      cursor: uploading ? "not-allowed" : "pointer",
                    }}
                  >
                    {uploading ? "Uploading…" : "Upload"}
                  </button>
                  <button
                    onClick={() => {
                      setCropFile(null);
                      setImgSrc(null);
                    }}
                    disabled={uploading}
                    style={btnSecondary}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ━━━ Section 3: Name ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div style={{ marginBottom: "40px" }}>
          <h2
            className="text-xs font-mono subtle-text"
            style={sectionHeading}
          >
            Name
          </h2>
          <div className="good-box" style={{ padding: "16px" }}>
            {editing ? (
              <nameFetcher.Form method="post" action="/fruits/profile">
                <input type="hidden" name="intent" value="update-profile" />
                <div
                  style={{ display: "flex", gap: "8px", alignItems: "center" }}
                >
                  <input
                    name="name"
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    autoFocus
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <button type="submit" style={btnPrimary}>
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    style={{ ...btnSecondary, padding: "8px 12px" }}
                  >
                    Cancel
                  </button>
                </div>
                {nameFetcher.data?.error && (
                  <p
                    style={{
                      color: "var(--red)",
                      fontSize: "0.8rem",
                      marginTop: "8px",
                      fontFamily: "monospace",
                    }}
                  >
                    {nameFetcher.data.error}
                  </p>
                )}
              </nameFetcher.Form>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                }}
              >
                <span style={{ fontSize: "1rem" }}>{user.name}</span>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  {nameFetcher.state === "idle" && nameFetcher.data?.ok && (
                    <span
                      className="green-text"
                      style={{ fontSize: "0.75rem", fontFamily: "monospace" }}
                    >
                      Saved!
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setEditing(true);
                      setNameValue(user.name);
                    }}
                    style={{
                      ...btnSecondary,
                      padding: "4px 12px",
                      color: "var(--purple-light)",
                    }}
                  >
                    Edit
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ━━━ Section 4: Email & Role ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div style={{ marginBottom: "40px" }}>
          <h2
            className="text-xs font-mono subtle-text"
            style={sectionHeading}
          >
            Account
          </h2>
          <div
            className="good-box p-4"
            style={{ display: "flex", gap: "40px" }}
          >
            <div>
              <div
                style={{
                  fontSize: "0.7rem",
                  color: "var(--text-subtle)",
                  fontFamily: "monospace",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: "4px",
                }}
              >
                Email
              </div>
              <div style={{ fontSize: "0.95rem" }}>{user.email}</div>
            </div>
            <div>
              <div
                style={{
                  fontSize: "0.7rem",
                  color: "var(--text-subtle)",
                  fontFamily: "monospace",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: "4px",
                }}
              >
                Role
              </div>
              <div style={{ fontSize: "0.95rem" }}>{user.role}</div>
            </div>
          </div>
        </div>

        {/* ━━━ Section 5: Office Hours ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div style={{ marginBottom: "40px" }}>
          <h2
            className="text-xs font-mono subtle-text"
            style={sectionHeading}
          >
            Office Hours
          </h2>
          <div className="good-box" style={{ padding: "20px" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                marginBottom: "20px",
              }}
            >
              {DAYS.map((day) => {
                const entry = localOH[day];
                return (
                  <div
                    key={day}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      flexWrap: "wrap",
                    }}
                  >
                    {/* Day toggle */}
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        cursor: "pointer",
                        minWidth: "128px",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={entry.enabled}
                        onChange={(e) =>
                          updateDay(day, { enabled: e.target.checked })
                        }
                      />
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: "0.85rem",
                          color: entry.enabled
                            ? "inherit"
                            : "var(--text-subtle)",
                        }}
                      >
                        {day.charAt(0).toUpperCase() + day.slice(1)}
                      </span>
                    </label>

                    {/* Time range */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <input
                        type="time"
                        value={entry.start}
                        disabled={!entry.enabled}
                        onChange={(e) =>
                          updateDay(day, { start: e.target.value })
                        }
                        style={{
                          padding: "3px 6px",
                          borderRadius: "4px",
                          border: "1px solid var(--foreground)",
                          background: "var(--farground)",
                          color: "inherit",
                          fontFamily: "monospace",
                          fontSize: "0.85rem",
                          opacity: entry.enabled ? 1 : 0.4,
                        }}
                      />
                      <span
                        style={{
                          color: "var(--text-subtle)",
                          fontFamily: "monospace",
                        }}
                      >
                        –
                      </span>
                      <input
                        type="time"
                        value={entry.end}
                        disabled={!entry.enabled}
                        onChange={(e) =>
                          updateDay(day, { end: e.target.value })
                        }
                        style={{
                          padding: "3px 6px",
                          borderRadius: "4px",
                          border: "1px solid var(--foreground)",
                          background: "var(--farground)",
                          color: "inherit",
                          fontFamily: "monospace",
                          fontSize: "0.85rem",
                          opacity: entry.enabled ? 1 : 0.4,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <ohFetcher.Form method="post" action="/fruits/profile">
              <input type="hidden" name="intent" value="update-office-hours" />
              <input
                type="hidden"
                name="officeHours"
                value={JSON.stringify(localOH)}
              />
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <button
                  type="submit"
                  style={{
                    ...btnPrimary,
                    opacity: ohFetcher.state !== "idle" ? 0.7 : 1,
                  }}
                >
                  {ohFetcher.state !== "idle"
                    ? "Saving…"
                    : "Save Office Hours"}
                </button>
                {ohFetcher.state === "idle" && ohFetcher.data?.ok && (
                  <span
                    className="green-text"
                    style={{ fontSize: "0.75rem", fontFamily: "monospace" }}
                  >
                    Saved!
                  </span>
                )}
              </div>
            </ohFetcher.Form>
          </div>
        </div>

        {/* ━━━ Section 6: Scheduled Events ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div style={{ marginBottom: "40px" }}>
          <h2
            className="text-xs font-mono subtle-text"
            style={sectionHeading}
          >
            Scheduled Events
          </h2>
          <p
            style={{
              fontSize: "0.8rem",
              color: "var(--text-subtle)",
              marginBottom: "16px",
              fontFamily: "monospace",
            }}
          >
            Upcoming all-day or multi-day events you plan to be away or busy.
          </p>

          {/* Add event form */}
          <addFetcher.Form
            key={addFormKey}
            method="post"
            action="/fruits/profile"
            style={{ marginBottom: "20px" }}
          >
            <input type="hidden" name="intent" value="add-event" />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <input
                name="name"
                type="text"
                required
                placeholder="Event name"
                style={inputStyle}
              />
              <div
                style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  <label
                    style={{
                      fontSize: "0.7rem",
                      fontFamily: "monospace",
                      color: "var(--text-subtle)",
                    }}
                  >
                    Start Date
                  </label>
                  <input
                    name="startDate"
                    type="date"
                    required
                    min={todayStr}
                    style={inputStyle}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  <label
                    style={{
                      fontSize: "0.7rem",
                      fontFamily: "monospace",
                      color: "var(--text-subtle)",
                    }}
                  >
                    End Date
                  </label>
                  <input
                    name="endDate"
                    type="date"
                    required
                    min={todayStr}
                    style={inputStyle}
                  />
                </div>
              </div>
              <div>
                <button
                  type="submit"
                  style={{
                    ...btnPrimary,
                    opacity: addFetcher.state !== "idle" ? 0.7 : 1,
                  }}
                >
                  {addFetcher.state !== "idle" ? "Adding…" : "Add Event"}
                </button>
              </div>
            </div>
            {addFetcher.data?.error && (
              <p
                style={{
                  color: "var(--red)",
                  fontSize: "0.8rem",
                  marginTop: "8px",
                  fontFamily: "monospace",
                }}
              >
                {addFetcher.data.error}
              </p>
            )}
          </addFetcher.Form>

          {/* Events list */}
          {visibleEvents.length === 0 ? (
            <div className="good-box" style={{ padding: "16px" }}>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "var(--text-subtle)",
                  fontFamily: "monospace",
                  margin: 0,
                }}
              >
                No upcoming events.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              {visibleEvents.map((event) => (
                <div
                  key={event.id}
                  className="good-box"
                  style={{
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                  }}
                >
                  <div>
                    <div
                      style={{ fontWeight: 600, marginBottom: "2px" }}
                    >
                      {event.name}
                    </div>
                    <div
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--text-subtle)",
                        fontFamily: "monospace",
                      }}
                    >
                      {formatDateRange(event.startDate, event.endDate)}
                    </div>
                  </div>
                  <removeFetcher.Form
                    method="post"
                    action="/fruits/profile"
                  >
                    <input type="hidden" name="intent" value="remove-event" />
                    <input
                      type="hidden"
                      name="eventId"
                      value={event.id}
                    />
                    <button
                      type="submit"
                      style={{
                        background: "none",
                        border: "1px solid var(--foreground)",
                        borderRadius: "6px",
                        padding: "4px 10px",
                        cursor: "pointer",
                        fontSize: "0.75rem",
                        fontFamily: "monospace",
                        color: "var(--red)",
                      }}
                    >
                      Remove
                    </button>
                  </removeFetcher.Form>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ━━━ Section 7: Log Out ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div
          style={{
            paddingTop: "16px",
            borderTop: "1px solid var(--foreground)",
          }}
        >
          <Link
            to="/logout"
            style={{
              display: "inline-block",
              padding: "8px 16px",
              borderRadius: "6px",
              border: "1px solid var(--foreground)",
              color: "var(--text-subtle)",
              textDecoration: "none",
              fontSize: "0.85rem",
              fontFamily: "monospace",
            }}
          >
            Log Out
          </Link>
        </div>

      </div>
    </AppLayout>
  );
}
