import React from "react";
import { Link, Links, Meta, Outlet, Scripts } from "@remix-run/react";

export default function App() {
  return (
    <html>
      <head>
        <link rel="icon" href="data:image/x-icon;base64,AA" />
        <Meta />
        <Links />
      </head>
      <body>
        <Link to="login">Login</Link>
        <h1>nopal</h1>
        <Outlet />

        <Scripts />
      </body>
    </html>
  );
}
