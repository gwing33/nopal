import {
  json,
  redirect,
  ActionFunctionArgs,
  LoaderFunctionArgs,
} from "@remix-run/node";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
  useRevalidator,
} from "@remix-run/react";
import { useEffect, useRef, useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

type DiscordAuthor = {
  id: string;
  username: string;
  global_name: string | null;
  avatar: string | null;
};

type DiscordMessage = {
  id: string;
  content: string;
  author: DiscordAuthor;
  timestamp: string;
};

type DiagResult = { ok: true; detail: string } | { ok: false; detail: string };

type LoaderData = {
  threadId: string | null;
  messages: DiscordMessage[];
  fetchError: string | null;
  diag: {
    botToken: DiagResult;
    channelAccess: DiagResult;
    guilds: DiagResult;
  } | null;
};

type ActionData = { ok: false; error: string };

// ── Helpers ───────────────────────────────────────────────────────────────────

async function checkBotToken(botToken: string): Promise<DiagResult> {
  try {
    const res = await fetch("https://discord.com/api/v10/users/@me", {
      headers: { Authorization: `Bot ${botToken}` },
    });
    if (!res.ok) {
      const body = await res.text();
      return { ok: false, detail: `HTTP ${res.status} — ${body}` };
    }
    const user = await res.json();
    return {
      ok: true,
      detail: `Authenticated as ${user.username}#${user.discriminator ?? "0"}`,
    };
  } catch (err) {
    return {
      ok: false,
      detail: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

async function checkGuilds(botToken: string): Promise<DiagResult> {
  try {
    const res = await fetch("https://discord.com/api/v10/users/@me/guilds", {
      headers: { Authorization: `Bot ${botToken}` },
    });
    if (!res.ok) {
      const body = await res.text();
      return { ok: false, detail: `HTTP ${res.status} — ${body}` };
    }
    const guilds: { id: string; name: string }[] = await res.json();
    if (guilds.length === 0) {
      return { ok: false, detail: "Bot is not in any servers." };
    }
    const names = guilds.map((g) => g.name).join(", ");
    return {
      ok: true,
      detail: `Member of ${guilds.length} server(s): ${names}`,
    };
  } catch (err) {
    return {
      ok: false,
      detail: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

async function checkChannelAccess(
  botToken: string,
  channelId: string
): Promise<DiagResult> {
  try {
    const res = await fetch(
      `https://discord.com/api/v10/channels/${channelId}`,
      { headers: { Authorization: `Bot ${botToken}` } }
    );
    if (!res.ok) {
      const body = await res.text();
      return { ok: false, detail: `HTTP ${res.status} — ${body}` };
    }
    const channel = await res.json();
    const name = channel.name ? `#${channel.name}` : `id ${channelId}`;
    return {
      ok: true,
      detail: `Can access ${name} (type ${channel.type})`,
    };
  } catch (err) {
    return {
      ok: false,
      detail: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ── Loader ────────────────────────────────────────────────────────────────────

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const threadId =
    url.searchParams.get("threadId") ?? process.env.DISCORD_THREAD_ID ?? null;
  const runDiag = url.searchParams.has("diag");

  const botToken = process.env.DISCORD_BOT_TOKEN;
  const channelId = process.env.DISCORD_CHANNEL_ID;

  const shouldDiag = runDiag || !botToken || !channelId;

  let diag: LoaderData["diag"] = null;

  if (shouldDiag) {
    if (!botToken || !channelId) {
      diag = {
        botToken: {
          ok: false,
          detail: botToken
            ? "Present"
            : "DISCORD_BOT_TOKEN is not set in environment variables.",
        },
        channelAccess: {
          ok: false,
          detail: channelId
            ? "Present"
            : "DISCORD_CHANNEL_ID is not set in environment variables.",
        },
        guilds: {
          ok: false,
          detail: "Cannot check — token or channel ID missing.",
        },
      };
    } else {
      const [botTokenResult, channelAccessResult, guildsResult] =
        await Promise.all([
          checkBotToken(botToken),
          checkChannelAccess(botToken, channelId),
          checkGuilds(botToken),
        ]);
      diag = {
        botToken: botTokenResult,
        channelAccess: channelAccessResult,
        guilds: guildsResult,
      };
    }
  }

  if (!threadId) {
    return json<LoaderData>({
      threadId: null,
      messages: [],
      fetchError: null,
      diag,
    });
  }

  if (!botToken) {
    return json<LoaderData>({
      threadId,
      messages: [],
      fetchError: "DISCORD_BOT_TOKEN is not set in environment variables.",
      diag,
    });
  }

  try {
    const res = await fetch(
      `https://discord.com/api/v10/channels/${threadId}/messages?limit=100`,
      { headers: { Authorization: `Bot ${botToken}` } }
    );

    if (!res.ok) {
      const body = await res.text();
      return json<LoaderData>({
        threadId,
        messages: [],
        fetchError: `Discord API returned ${res.status}: ${body}`,
        diag,
      });
    }

    const messages: DiscordMessage[] = await res.json();
    messages.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    return json<LoaderData>({
      threadId,
      messages,
      fetchError: null,
      diag,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return json<LoaderData>({
      threadId,
      messages: [],
      fetchError: `Fetch failed: ${message}`,
      diag,
    });
  }
}

// ── Action ────────────────────────────────────────────────────────────────────

export async function action({ request }: ActionFunctionArgs) {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  const channelId = process.env.DISCORD_CHANNEL_ID;

  if (!botToken) {
    return json<ActionData>({
      ok: false,
      error: "DISCORD_BOT_TOKEN is not set in environment variables.",
    });
  }

  const formData = await request.formData();
  const content = formData.get("content")?.toString().trim();
  const threadId = formData.get("threadId")?.toString().trim() || null;
  const threadName = formData.get("threadName")?.toString().trim() || null;

  if (!content) {
    return json<ActionData>({ ok: false, error: "Message cannot be empty." });
  }

  if (content.length > 2000) {
    return json<ActionData>({
      ok: false,
      error: "Message exceeds Discord's 2000 character limit.",
    });
  }

  try {
    if (threadId) {
      // ── Post to existing thread ────────────────────────────────────────────
      const res = await fetch(
        `https://discord.com/api/v10/channels/${threadId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bot ${botToken}`,
          },
          body: JSON.stringify({ content }),
        }
      );

      if (!res.ok) {
        const body = await res.text();
        return json<ActionData>({
          ok: false,
          error: `Discord returned ${res.status}: ${body}`,
        });
      }

      const url = new URL(request.url);
      url.searchParams.set("threadId", threadId);
      return redirect(url.pathname + url.search);
    } else {
      // ── Create a new thread ────────────────────────────────────────────────
      if (!channelId) {
        return json<ActionData>({
          ok: false,
          error: "DISCORD_CHANNEL_ID is required to start a new thread.",
        });
      }

      // Fetch the parent channel type to build the correct payload.
      // Forum (15) and Media (16) channels don't accept an explicit `type`
      // field when creating threads, while text channels require `type: 11`.
      const channelRes = await fetch(
        `https://discord.com/api/v10/channels/${channelId}`,
        { headers: { Authorization: `Bot ${botToken}` } }
      );

      if (!channelRes.ok) {
        const body = await channelRes.text();
        return json<ActionData>({
          ok: false,
          error: `Failed to fetch channel info: ${body}`,
        });
      }

      const channel = await channelRes.json();
      // GUILD_FORUM = 15, GUILD_MEDIA = 16
      const isForumOrMediaChannel = channel.type === 15 || channel.type === 16;

      const name = threadName || content.slice(0, 100);

      if (isForumOrMediaChannel) {
        // Forum/media channels accept the starter message inline.
        const res = await fetch(
          `https://discord.com/api/v10/channels/${channelId}/threads`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bot ${botToken}`,
            },
            body: JSON.stringify({ name, message: { content } }),
          }
        );

        if (!res.ok) {
          const body = await res.text();
          return json<ActionData>({
            ok: false,
            error: `Discord returned ${res.status}: ${body}`,
          });
        }

        const thread = await res.json();
        const url = new URL(request.url);
        url.searchParams.set("threadId", thread.id);
        return redirect(url.pathname + url.search);
      } else {
        // Text channels: create an empty thread first, then post to it.
        const createRes = await fetch(
          `https://discord.com/api/v10/channels/${channelId}/threads`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bot ${botToken}`,
            },
            body: JSON.stringify({ name, type: 11 }),
          }
        );

        if (!createRes.ok) {
          const body = await createRes.text();
          return json<ActionData>({
            ok: false,
            error: `Discord returned ${createRes.status}: ${body}`,
          });
        }

        const thread = await createRes.json();

        const msgRes = await fetch(
          `https://discord.com/api/v10/channels/${thread.id}/messages`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bot ${botToken}`,
            },
            body: JSON.stringify({ content }),
          }
        );

        if (!msgRes.ok) {
          const body = await msgRes.text();
          return json<ActionData>({
            ok: false,
            error: `Thread created but message failed: ${msgRes.status}: ${body}`,
          });
        }

        const url = new URL(request.url);
        url.searchParams.set("threadId", thread.id);
        return redirect(url.pathname + url.search);
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return json<ActionData>({ ok: false, error: `Fetch failed: ${message}` });
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 5_000;

export default function MrgntDiscord() {
  const { threadId, messages, fetchError, diag } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const revalidator = useRevalidator();

  const isSubmitting = navigation.state === "submitting";

  const replyFormRef = useRef<HTMLFormElement>(null);
  const [replyContent, setReplyContent] = useState("");

  function handleSubmit(ref: HTMLFormElement) {
    ref.requestSubmit();
    setReplyContent("");
  }

  function handleReplyKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      replyFormRef.current &&
        handleSubmit(replyFormRef.current as HTMLFormElement);
    }
  }

  // Auto-poll for new messages while a thread is active
  useEffect(() => {
    if (!threadId) return;
    const id = setInterval(() => {
      if (revalidator.state === "idle") revalidator.revalidate();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [threadId, revalidator]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center pt-16 px-4 pb-16">
      <div className="w-full max-w-lg flex flex-col gap-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            Nopalito Discord Bot
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Test page for sending and running diagnostics for the Discord bot.
          </p>
        </div>

        {/* Diagnostics panel */}
        {diag && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Diagnostics
            </p>
            <DiagRow label="Bot token" result={diag.botToken} />
            <DiagRow label="Server membership" result={diag.guilds} />
            <DiagRow label="Channel access" result={diag.channelAccess} />
            {diag.botToken.ok && diag.channelAccess.ok && (
              <p className="text-xs text-green-600 font-medium">
                Everything looks good. You can dismiss this panel by removing{" "}
                <code className="font-mono bg-gray-100 px-1 py-0.5 rounded">
                  ?diag
                </code>{" "}
                from the URL.
              </p>
            )}
            {(!diag.botToken.ok || !diag.channelAccess.ok) && (
              <a
                href="?diag"
                className="text-xs text-purple-600 hover:text-purple-800 self-start"
              >
                Re-run diagnostics
              </a>
            )}
          </div>
        )}

        {/* Trigger diagnostics link (only shown when diag panel is hidden) */}
        {!diag && (
          <div className="text-right">
            <a
              href="?diag"
              className="text-xs text-gray-400 hover:text-purple-600"
            >
              Run diagnostics
            </a>
          </div>
        )}

        {threadId ? (
          // ── Active thread view ───────────────────────────────────────────────
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-gray-600">
                Thread{" "}
                <span className="text-gray-400 font-normal">
                  (polling every {POLL_INTERVAL_MS / 1000}s)
                </span>
              </h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => revalidator.revalidate()}
                  disabled={revalidator.state === "loading"}
                  className="text-xs text-purple-600 hover:text-purple-800 disabled:opacity-40"
                >
                  Refresh
                </button>
                <a
                  href="."
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  New thread
                </a>
              </div>
            </div>

            {/* Fetch error */}
            {fetchError && (
              <div className="rounded-lg px-4 py-3 text-sm bg-red-50 text-red-700 border border-red-200">
                {fetchError}
              </div>
            )}

            {/* Messages */}
            {messages.map((msg) => (
              <MessageCard key={msg.id} message={msg} />
            ))}

            {/* Empty state */}
            {!fetchError && messages.length === 0 && (
              <div className="bg-white rounded-xl border border-gray-200 px-5 py-6 text-center text-sm text-gray-400">
                No messages yet.
              </div>
            )}

            {/* Reply form */}
            <Form
              onSubmit={handleSubmit}
              ref={replyFormRef}
              method="post"
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col gap-3"
            >
              <input type="hidden" name="threadId" value={threadId} />
              <label
                htmlFor="reply-content"
                className="text-sm font-medium text-gray-700"
              >
                Reply in thread
              </label>
              <textarea
                id="reply-content"
                name="content"
                required
                rows={3}
                maxLength={2000}
                placeholder="Write a reply… (Shift+Enter to send)"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                onKeyDown={handleReplyKeyDown}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent resize-y"
              />
              {actionData && !isSubmitting && (
                <div className="rounded-lg px-4 py-3 text-sm bg-red-50 text-red-700 border border-red-200">
                  {actionData.error}
                </div>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="self-end bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                {isSubmitting ? "Sending…" : "Reply"}
              </button>
            </Form>

            {/* Thread ID reference */}
            <p className="text-xs text-gray-400 text-center">
              Thread{" "}
              <code className="font-mono bg-gray-100 px-1 py-0.5 rounded">
                {threadId}
              </code>
            </p>
          </div>
        ) : (
          // ── Start new thread form ────────────────────────────────────────────
          <Form
            method="post"
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col gap-5"
          >
            {/* Thread name */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="threadName"
                className="text-sm font-medium text-gray-700"
              >
                Thread name{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                id="threadName"
                name="threadName"
                type="text"
                maxLength={100}
                placeholder="Defaults to the first 100 characters of your message"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
              />
            </div>

            {/* Message */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="content"
                className="text-sm font-medium text-gray-700"
              >
                Message <span className="text-red-400">*</span>
              </label>
              <textarea
                id="content"
                name="content"
                required
                rows={4}
                maxLength={2000}
                placeholder="What do you want to say?"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent resize-y"
              />
              <p className="text-xs text-gray-400 text-right">
                max 2000 characters
              </p>
            </div>

            {/* Action error */}
            {actionData && !isSubmitting && (
              <div className="rounded-lg px-4 py-3 text-sm bg-red-50 text-red-700 border border-red-200">
                {actionData.error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="self-end bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              {isSubmitting ? "Starting…" : "Start Thread"}
            </button>
          </Form>
        )}

        {/* Env hint */}
        <p className="text-xs text-gray-400 text-center">
          Requires{" "}
          <code className="font-mono bg-gray-100 px-1 py-0.5 rounded">
            DISCORD_BOT_TOKEN
          </code>{" "}
          and{" "}
          <code className="font-mono bg-gray-100 px-1 py-0.5 rounded">
            DISCORD_CHANNEL_ID
          </code>{" "}
          in your environment.
        </p>
      </div>
    </div>
  );
}

// ── Diag row ──────────────────────────────────────────────────────────────────

function DiagRow({ label, result }: { label: string; result: DiagResult }) {
  return (
    <div className="flex items-start gap-3">
      <span
        className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold ${
          result.ok ? "bg-green-500" : "bg-red-500"
        }`}
      >
        {result.ok ? "\u2713" : "\u2717"}
      </span>
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span
          className={`text-xs font-mono ${
            result.ok ? "text-green-700" : "text-red-600"
          }`}
        >
          {result.detail}
        </span>
      </div>
    </div>
  );
}

// ── Message card ──────────────────────────────────────────────────────────────

function MessageCard({ message }: { message: DiscordMessage }) {
  const displayName = message.author.global_name ?? message.author.username;
  const avatarUrl = message.author.avatar
    ? `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}.png?size=64`
    : `https://cdn.discordapp.com/embed/avatars/${
        Number(BigInt(message.author.id) >> 22n) % 6
      }.png`;

  const formattedTime = new Date(message.timestamp).toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex gap-3">
      <img
        src={avatarUrl}
        alt={displayName}
        className="w-8 h-8 rounded-full flex-shrink-0 mt-0.5"
      />
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium text-gray-800 truncate">
            {displayName}
          </span>
          <span className="text-xs text-gray-400 flex-shrink-0">
            {formattedTime}
          </span>
        </div>
        <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
          {message.content}
        </p>
      </div>
    </div>
  );
}
