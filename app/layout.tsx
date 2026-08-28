import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'AI Coach OS',
  description: 'AI-powered operating system for fitness and transformation coaches.',
};

/**
 * Every route in this app is statically prerendered (confirmed via the
 * build's prerender-manifest.json — no middleware, no dynamic APIs used
 * anywhere in app/). Reading the theme cookie server-side here (`await
 * cookies()`) would make this layout — and therefore every route that
 * renders through it — a Dynamic API user, forcing the whole app out of
 * static generation with no PPR boundary configured. So instead of an SSR
 * cookie read, this is a blocking inline script (the same technique
 * next-themes uses internally) that runs before first paint and adds the
 * `light` class straight to the DOM — same regex style as
 * services/api-client.ts's readCookie. <html> needs suppressHydrationWarning
 * since its class is legitimately mutated before React hydrates.
 */
const THEME_INIT_SCRIPT = `(function(){try{var m=document.cookie.match(/(?:^|; )theme=([^;]*)/);if(m&&decodeURIComponent(m[1])==='light'){document.documentElement.classList.add('light');}}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
