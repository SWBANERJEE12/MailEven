export interface MailEvenPreferences {
  theme: "light" | "dark" | "system";
  accountFilter?: string;
  lastActiveAccount?: string;
  lastTagFilter?: string;
  bodyRetentionDays?: number;
  dismissedCookieNotice?: boolean;
}

export const PREFERENCES_COOKIE_NAME = "maileven_prefs";

export const DEFAULT_PREFERENCES: MailEvenPreferences = {
  theme: "system",
  accountFilter: "all",
  lastActiveAccount: "all",
  lastTagFilter: "All",
  bodyRetentionDays: 30,
  dismissedCookieNotice: false,
};

/**
 * Parses preferences cookie string safely.
 */
export function parsePreferences(cookieValue?: string | null): MailEvenPreferences {
  if (!cookieValue) return { ...DEFAULT_PREFERENCES };
  try {
    const parsed = JSON.parse(decodeURIComponent(cookieValue));
    const validTheme =
      parsed.theme === "light" || parsed.theme === "dark" || parsed.theme === "system"
        ? parsed.theme
        : "system";
    const accountFilter = parsed.accountFilter || parsed.lastActiveAccount || "all";

    return {
      theme: validTheme,
      accountFilter,
      lastActiveAccount: accountFilter,
      lastTagFilter: parsed.lastTagFilter || "All",
      bodyRetentionDays: typeof parsed.bodyRetentionDays === "number" ? parsed.bodyRetentionDays : 30,
      dismissedCookieNotice: Boolean(parsed.dismissedCookieNotice),
    };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

/**
 * Applies the given theme to document.documentElement synchronously.
 */
export function applyThemeToDocument(theme: "light" | "dark" | "system") {
  if (typeof document === "undefined") return;

  let isDark = false;
  if (theme === "dark") {
    isDark = true;
  } else if (theme === "light") {
    isDark = false;
  } else {
    // system preference
    isDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  if (isDark) {
    document.documentElement.classList.add("dark");
    document.documentElement.classList.remove("light");
  } else {
    document.documentElement.classList.add("light");
    document.documentElement.classList.remove("dark");
  }
}

/**
 * Reads preferences in client components from document.cookie.
 */
export function getPreferencesClient(): MailEvenPreferences {
  if (typeof document === "undefined") return { ...DEFAULT_PREFERENCES };

  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${PREFERENCES_COOKIE_NAME}=`));

  if (!match) return { ...DEFAULT_PREFERENCES };
  return parsePreferences(match.split("=")[1]);
}

/**
 * Updates preferences in client and persists to the typed preference cookie.
 */
export function setPreferencesClient(updates: Partial<MailEvenPreferences>): MailEvenPreferences {
  if (typeof document === "undefined") return { ...DEFAULT_PREFERENCES, ...updates };

  const current = getPreferencesClient();
  const accountFilter =
    updates.accountFilter ?? updates.lastActiveAccount ?? current.accountFilter ?? "all";

  const merged: MailEvenPreferences = {
    ...current,
    ...updates,
    accountFilter,
    lastActiveAccount: accountFilter,
  };

  const encoded = encodeURIComponent(JSON.stringify(merged));
  // 365-day expiry, Lax, Root path
  document.cookie = `${PREFERENCES_COOKIE_NAME}=${encoded}; path=/; max-age=31536000; SameSite=Lax`;

  // Synchronize <html> class immediately
  applyThemeToDocument(merged.theme);

  return merged;
}
