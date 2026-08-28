import { create } from 'zustand';

export type Theme = 'light' | 'dark';

const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year — covers "remember for next login" without a User column

/** Cookie is the only persistence layer — no localStorage/persist middleware, that would just be a second, divergeable copy. */
function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('light', theme === 'light');
  const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; secure' : '';
  document.cookie = `theme=${theme}; path=/; max-age=${THEME_COOKIE_MAX_AGE}; samesite=lax${secure}`;
}

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

/**
 * Mirrors stores/ui-store.ts's shape. Starts at 'dark' UNCONDITIONALLY —
 * every route is statically prerendered, so the shipped HTML always has
 * 'dark' baked in regardless of any visitor's actual cookie. Reading the
 * real DOM class here (at module-eval or lazy-init time) would make this
 * store disagree with that server-rendered HTML during React's hydration
 * pass itself — a genuine hydration mismatch on every consumer
 * (providers.tsx's Toaster, the Settings page's own toggle buttons), not
 * just a cosmetic one, for any returning light-mode visitor on a full page
 * load. `syncThemeFromDom` (called once from Providers, in a
 * useLayoutEffect so it runs before paint) corrects this — a plain
 * post-hydration state update runs strictly after hydration commits, so it
 * never produces a hydration diff, only a normal re-render.
 */
export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'dark',
  setTheme: (theme) => {
    applyTheme(theme);
    set({ theme });
  },
}));

export function syncThemeFromDom(): void {
  const theme: Theme = document.documentElement.classList.contains('light') ? 'light' : 'dark';
  useThemeStore.setState({ theme });
}
