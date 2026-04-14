import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Shell } from '@/components/shell';

export const metadata: Metadata = {
  title: 'GameMarket — цифровые игровые товары',
  description: 'P2P маркетплейс с безопасной сделкой и чатом',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: [{ media: '(prefers-color-scheme: dark)', color: '#09090b' }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className="min-h-screen">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Shell>{children}</Shell>
        </ThemeProvider>
      </body>
    </html>
  );
}
