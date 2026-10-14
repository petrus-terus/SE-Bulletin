export type ThemePreference = 'light' | 'system' | 'dark';
export type EffectiveTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'sesb_theme';

export function getStoredThemePreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch {
    // localStorage unavailable or restricted
  }
  return 'system';
}

export function setStoredThemePreference(preference: ThemePreference): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // ignore quota/security errors
  }
}
