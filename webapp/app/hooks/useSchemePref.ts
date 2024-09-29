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
    // Mobile safari doesn't support Accept-CH. This should bring it into alignment after load
    const matchMode = window.matchMedia("(prefers-color-scheme: dark)");
    setScheme(doesMatchLightOrDark(matchMode));
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", (e) => {
        setScheme(doesMatchLightOrDark(e));
      });
  }, []);
  return schemePref;
}

function doesMatchLightOrDark(e) {
  return e.matches ? "dark" : "light";
}
