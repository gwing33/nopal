// app/hooks/useUser.ts
import { useMatches } from "react-router";
import type { Human } from "../data/humans.server";

export function useUser(): Human | null {
  const matches = useMatches();
  for (const match of [...matches].reverse()) {
    const data = match.data as Record<string, unknown> | null | undefined;
    if (data && typeof data === "object" && "user" in data && data.user) {
      return data.user as Human;
    }
  }
  return null;
}
