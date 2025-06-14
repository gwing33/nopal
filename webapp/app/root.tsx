import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteError,
  isRouteErrorResponse,
} from "@remix-run/react";
import {
  MetaFunction,
  LinksFunction,
  json,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import styles from "./styles/root.css?url";
import faviconAppleTouch from "./images/favicon/apple-touch-icon.png";
import favicon32 from "./images/favicon/favicon-32x32.png";
import favicon16 from "./images/favicon/favicon-16x16.png";
import faviconManifest from "./images/favicon/site.webmanifest";
import faviconSafari from "./images/favicon/safari-pinned-tab.svg";
import favicon from "./images/favicon/favicon.ico";
import "./tailwind.css";
import { ReactNode } from "react";
import { getClientHints, type ClientHints } from "./util/getClientHints";
import { getPublicUrl } from "./util/getPublicUrl";

export const links: LinksFunction = () => [
  // Favicon
  { rel: "apple-touch-icon", sizes: "180x180", href: faviconAppleTouch },
  { rel: "icon", type: "image/png", sizes: "32x32", href: favicon32 },
  { rel: "icon", type: "image/png", sizes: "16x16", href: favicon16 },
  { rel: "manifest", href: faviconManifest },
  { rel: "mask-icon", color: "#5bbad5", href: faviconSafari },
  { rel: "shortcut icon", href: favicon },

  // Styles
  { rel: "stylesheet", href: styles },
];

export const meta: MetaFunction = () => [
  { title: "Building Healthy Homes" },
  { name: "description", content: "Nopal builds healthy homes for humans" },
  {
    name: "keywords",
    content:
      "Home, House, Build, High Performance, Health, Sustainable, Natural Materials",
  },
];

export const headers = () => ({
  // Enables client hints for the Sec-CH-Prefers-Color-Scheme header
  "Accept-CH": "Sec-CH-Prefers-Color-Scheme",
});

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="msapplication-TileColor" content="#fff9f1" />
        <meta name="theme-color" content="#fff9f1" />
        <meta
          name="msapplication-config"
          content={getPublicUrl("images/favicon/browserconfig.xml")}
        />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <Scripts />
        <ScrollRestoration />
      </body>
    </html>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <>
        <h1>
          {error.status} {error.statusText}
        </h1>
        <p>{error.data}</p>
      </>
    );
  }

  return (
    <>
      <h1>Error!</h1>
      {/* @ts-ignore */}
      <p>{error?.message ?? "Unknown error"}</p>
    </>
  );
}

export default function App() {
  return <Outlet />;
}

export type RootLoaderData = {
  requestInfo: { clientHints: ClientHints };
};

export async function loader({ request }: LoaderFunctionArgs) {
  return json({
    requestInfo: {
      clientHints: getClientHints(request),
    },
  });
}
