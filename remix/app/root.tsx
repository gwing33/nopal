import {
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  useLocation,
} from "@remix-run/react";
import { LinksFunction } from "@remix-run/node";
import styles from "./styles/root.css?url";

import "./tailwind.css";

export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }];

export default function App() {
  const location = useLocation();

  return (
    <html>
      <head>
        <link rel="icon" href="data:image/x-icon;base64,AA" />
        <Meta />
        <Links />
      </head>
      <body>
        <div className="py-4 px-8 flex justify-between items-center">
          <div />
          <h1 className="text-6xl text-center">nopal</h1>
          {!location.pathname.includes("login") ? (
            <Link className="p-1 hover:text-emerald-600" to="login">
              Login
            </Link>
          ) : (
            <div />
          )}
        </div>

        <Outlet />

        <Scripts />
      </body>
    </html>
  );
}
