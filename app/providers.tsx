'use client';

import { useLayoutEffect, useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { createQueryClient } from '@/lib/query-client';
import { useThemeStore, syncThemeFromDom } from '@/stores/theme-store';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  const theme = useThemeStore((state) => state.theme);

  // useThemeStore starts at 'dark' unconditionally to match every
  // statically-prerendered page's server HTML (see theme-store.ts) — this
  // corrects it to the real DOM state (set by layout.tsx's inline script)
  // in a layout effect, which runs before paint but strictly after
  // hydration commits, so it's a normal re-render rather than a hydration
  // mismatch on this Toaster prop or the Settings page's own toggle state.
  useLayoutEffect(() => {
    syncThemeFromDom();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster theme={theme} position="top-right" richColors />
    </QueryClientProvider>
  );
}
