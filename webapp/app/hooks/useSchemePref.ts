import { useRouteLoaderData } from "@remix-run/react";
import { useEffect, useState } from "react";
import { type RootLoaderData } from "../root";

export function useSchemePref() {
  const data = useRouteLoaderData<RootLoaderData>("root");
  const clientHints = data?.requestInfo?.clientHints;
  const colorSchemaPref =
    clientHints?.colorSchemePref || clientHints?.sysColorSchemePref;
  const [schemePref, setScheme] = useState(colorSchemaPref);
  useEffect(() => {
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", (e) => {
        setScheme(e.matches ? "dark" : "light");
      });
  }, []);
  return schemePref;
}
