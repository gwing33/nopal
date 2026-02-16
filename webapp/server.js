import { createRequestHandler } from "@remix-run/express";
import express from "express";

const viteDevServer =
  process.env.NODE_ENV === "production"
    ? null
    : await import("vite").then((vite) =>
        vite.createServer({
          server: { middlewareMode: true },
        })
      );

const app = express();
app.use(
  viteDevServer ? viteDevServer.middlewares : express.static("build/client")
);

const build = viteDevServer
  ? () => viteDevServer.ssrLoadModule("virtual:remix/server-build")
  : await import("./build/server/index.js");

app.all("*", createRequestHandler({ build }));

app.listen(3000, () => {
  console.log("App listening on http://localhost:3000");

  // Notion incremental sync — every 15 minutes
  // Self-requests the webhook endpoint so it goes through the full Remix pipeline
  if (process.env.NOTION_WEBHOOK_SECRET) {
    const FIFTEEN_MINUTES = 15 * 60 * 1000;

    const runSync = async () => {
      try {
        const res = await fetch(
          "http://localhost:3000/api/notion-webhook?cron=1",
          {
            headers: {
              Authorization: `Bearer ${process.env.NOTION_WEBHOOK_SECRET}`,
            },
          }
        );
        const data = await res.json();
        console.log("[cron] Notion incremental sync:", JSON.stringify(data));
      } catch (e) {
        console.error("[cron] Notion sync failed:", e.message);
      }
    };

    // Then repeat every 15 minutes
    setInterval(runSync, FIFTEEN_MINUTES);

    console.log("[cron] Notion sync scheduled (every 15 min)");
  }
});
