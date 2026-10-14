import {
  type ThemePreference,
  type EffectiveTheme,
  THEME_STORAGE_KEY,
  getStoredThemePreference,
  setStoredThemePreference,
} from './themeStorage';

export { THEME_STORAGE_KEY };

export interface ThemeState {
  preference: ThemePreference;
  effectiveTheme: EffectiveTheme;
}

const listeners = new Set<() => void>();

export function resolveEffectiveTheme(pref: ThemePreference): EffectiveTheme {
  if (pref === 'light') return 'light';
  if (pref === 'dark') return 'dark';
  if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

function applyDomTheme(effective: EffectiveTheme, animate = false) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  if (animate && window.matchMedia && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    root.classList.add('theme-transitioning');
    window.setTimeout(() => {
      root.classList.remove('theme-transitioning');
    }, 240);
  }

  root.dataset.theme = effective;
  root.style.colorScheme = effective;

  const meta = document.getElementById('app-theme-color');
  if (meta) {
    meta.setAttribute('content', effective === 'dark' ? '#0B0F17' : '#F5F7FA');
  }
}

// Initial state hydrated from pre-paint script
const initialPref = typeof window !== 'undefined' ? getStoredThemePreference() : 'system';
const initialDomTheme =
  typeof document !== 'undefined' && document.documentElement.dataset.theme === 'dark'
    ? 'dark'
    : typeof document !== 'undefined' && document.documentElement.dataset.theme === 'light'
      ? 'light'
      : null;

const initialEffective = initialDomTheme || resolveEffectiveTheme(initialPref);

// Always ensure DOM is aligned
if (typeof document !== 'undefined') {
  applyDomTheme(initialEffective, false);
}

let state: ThemeState = Object.freeze({
  preference: initialPref,
  effectiveTheme: initialEffective,
});

function emitChange(nextState: ThemeState) {
  state = Object.freeze(nextState);
  listeners.forEach((listener) => listener());
}

export function setPreference(nextPref: ThemePreference) {
  const nextEffective = resolveEffectiveTheme(nextPref);
  if (state.preference === nextPref && state.effectiveTheme === nextEffective) {
    return;
  }
  setStoredThemePreference(nextPref);
  applyDomTheme(nextEffective, true);
  emitChange({ preference: nextPref, effectiveTheme: nextEffective });
}

export function getThemeSnapshot(): ThemeState {
  return state;
}

export function subscribeTheme(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Global listeners for OS changes and cross-tab storage changes
if (typeof window !== 'undefined') {
  // 1. matchMedia change listener
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handleMediaChange = () => {
    if (state.preference === 'system') {
      const nextEffective = mediaQuery.matches ? 'dark' : 'light';
      if (nextEffective !== state.effectiveTheme) {
        applyDomTheme(nextEffective, false);
        emitChange({ preference: 'system', effectiveTheme: nextEffective });
      }
    }
  };

  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handleMediaChange);
  } else if ('addListener' in mediaQuery) {
    (mediaQuery as any).addListener(handleMediaChange);
  }

  // 2. Storage event for cross-tab synchronization
  window.addEventListener('storage', (e) => {
    if (e.key === 'sesb_theme') {
      const newPref = getStoredThemePreference();
      const newEffective = resolveEffectiveTheme(newPref);
      applyDomTheme(newEffective, false);
      emitChange({ preference: newPref, effectiveTheme: newEffective });
    }
  });
}
