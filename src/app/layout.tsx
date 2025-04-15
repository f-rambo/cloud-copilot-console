import type { Metadata } from 'next';
import './globals.css';
import ThemeProvider from '@/components/ThemeToggle/theme-provider';
import { fontVariables } from '@/lib/font';
import { cn } from '@/lib/utils';
import { cookies } from 'next/headers';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/auth-context';

export const metadata: Metadata = {
  title: 'Console',
  description:
    'Console is the web front-end project of the Cloud Copilot project.'
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const activeThemeValue = cookieStore.get('active_theme')?.value;
  return (
    <html
      lang='en'
      className={activeThemeValue}
      style={{ colorScheme: activeThemeValue }}
    >
      <body className={cn(fontVariables)}>
        <ThemeProvider
          attribute='class'
          defaultTheme='system'
          enableSystem
          disableTransitionOnChange
          enableColorScheme
        >
          <AuthProvider>{children}</AuthProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
