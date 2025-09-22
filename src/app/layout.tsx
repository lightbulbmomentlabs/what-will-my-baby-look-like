import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { ClerkProvider } from '@clerk/nextjs';
import { APP_CONFIG } from '@/lib/constants';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: APP_CONFIG.name,
    template: `%s | ${APP_CONFIG.name}`,
  },
  description: APP_CONFIG.description,
  keywords: [...APP_CONFIG.keywords],
  authors: [{ name: 'Baby Predictor Team' }],
  creator: 'Baby Predictor Team',
  publisher: 'Baby Predictor Team',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: APP_CONFIG.url,
    siteName: APP_CONFIG.name,
    title: APP_CONFIG.name,
    description: APP_CONFIG.description,
    images: [
      {
        url: 'https://whatwillmybabylooklike.com/wwmbll-feat-image.jpg',
        width: 1200,
        height: 630,
        alt: APP_CONFIG.name,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: APP_CONFIG.name,
    description: APP_CONFIG.description,
    images: ['https://whatwillmybabylooklike.com/wwmbll-feat-image.jpg'],
    creator: '@babypredictorapp',
  },
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          {/* Google tag (gtag.js) */}
          <script async src="https://www.googletagmanager.com/gtag/js?id=G-TDKLLZ8RY4"></script>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'G-TDKLLZ8RY4');
              `,
            }}
          />
          <script
            dangerouslySetInnerHTML={{
              __html: `
                // Fix hash fragment SSO callback URLs
                (function() {
                  if (typeof window !== 'undefined' && window.location.hash && window.location.hash.includes('/sso-callback')) {
                    console.log('Hash fragment SSO callback detected, fixing URL...');
                    const hashPart = window.location.hash.substring(1);
                    const newUrl = window.location.origin + '/' + hashPart;
                    console.log('Redirecting from', window.location.href, 'to', newUrl);
                    window.location.replace(newUrl);
                  }
                })();
              `,
            }}
          />
        </head>
        <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem={true}
            disableTransitionOnChange={false}
            storageKey="baby-predictor-theme"
          >
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
