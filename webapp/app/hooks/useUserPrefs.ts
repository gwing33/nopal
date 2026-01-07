import { getUserPrefs, setUserPrefs } from "../util/userPrefs";
import type { UserPrefs } from "../util/userPrefs";
import { useEffect, useState } from "react";

export function useUserPrefs(): [UserPrefs, (prefs: UserPrefs) => void] {
  const [prefs, setPrefs] = useState(getUserPrefs());

  useEffect(() => {
    setUserPrefs(prefs);
  }, [prefs]);

  return [prefs, setPrefs];
}
