import { useSyncExternalStore } from 'react';
import {
  getThemeSnapshot,
  subscribeTheme,
  setPreference,
  type ThemeState,
} from './themeStore';
import type { ThemePreference, EffectiveTheme } from './themeStorage';

export interface UseThemeReturn {
  preference: ThemePreference;
  effectiveTheme: EffectiveTheme;
  setPreference: (preference: ThemePreference) => void;
}

export function useTheme(): UseThemeReturn {
  const snapshot: ThemeState = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getThemeSnapshot
  );

  return {
    preference: snapshot.preference,
    effectiveTheme: snapshot.effectiveTheme,
    setPreference,
  };
}

export type { ThemePreference, EffectiveTheme };
