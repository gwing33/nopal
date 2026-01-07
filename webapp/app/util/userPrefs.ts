export type UserPrefs = {
  newsletter: boolean;
};

export function getUserPrefs(): UserPrefs {
  const prefStr =
    typeof window !== "undefined" ? localStorage.getItem("userPrefs") : null;
  const prefs = prefStr
    ? JSON.parse(prefStr)
    : {
        newsletter: false,
      };

  return prefs;
}

export function setUserPrefs(prefs: UserPrefs) {
  localStorage?.setItem("userPrefs", JSON.stringify(prefs));
}
