import { APP_DESCRIPTION, APP_NAME } from '@/lib/config';
import { MyThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { ClerkProvider } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import localFont from 'next/font/local';
import type React from 'react';
import ClientLayout from './client-layout';
import './globals.css';

const nunitoSans = localFont({
  src: [
    {
      path: '../../public/fonts/NunitoSans-VariableFont_YTLC,opsz,wdth,wght.ttf',
      style: 'normal',
    },
    {
      path: '../../public/fonts/NunitoSans-Italic-VariableFont_YTLC,opsz,wdth,wght.ttf',
      style: 'italic',
    },
  ],
  variable: '--font-nunito-sans',
  display: 'swap',
});

export const metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  const isSignedIn = !!userId;

  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={nunitoSans.className}>
          <MyThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <ClientLayout isSignedIn={isSignedIn}>{children}</ClientLayout>
            <Toaster />
          </MyThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
