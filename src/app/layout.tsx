import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import AuthSentinel from '@/components/AuthSentinel';
import { SimulatorProvider } from '@/contexts/SimulatorContext';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';
import NotificationManager from '@/components/NotificationManager';
import LiveEventToast from '@/components/LiveEventToast';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://delhi-carbon-sentinel.vercel.app'),
  title: {
    default: 'Quantum Sentinel — Delhi Carbon Dashboard',
    template: '%s | Quantum Sentinel',
  },
  description:
    'Real-time AI-powered carbon emissions monitoring, eco-routing, and policy simulation for Delhi. Track CO2 levels, identify pollution hotspots, and join the green revolution.',
  keywords: [
    'Delhi carbon emissions',
    'air quality India',
    'CO2 tracker',
    'sustainability dashboard',
    'eco routes Delhi',
    'smart city',
    'climate tech',
  ],
  authors: [{ name: 'Quantum Sentinel Team' }],
  themeColor: '#10b981',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://delhi-carbon-sentinel.vercel.app',
    siteName: 'Quantum Sentinel',
    title: 'Quantum Sentinel — Delhi Carbon Dashboard',
    description:
      'Track Delhi\'s real-time CO2 emissions, simulate green policies, and find eco-friendly routes.',
    images: [
      {
        url: '/delhi-corridor.png',
        width: 1200,
        height: 630,
        alt: 'Delhi Sustainable Corridor — Quantum Sentinel',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Quantum Sentinel — Delhi Carbon Dashboard',
    description:
      'Real-time AI carbon monitoring for Delhi. Join the green revolution.',
    images: ['/delhi-corridor.png'],
    creator: '@quantumsentinel',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: '#10b981',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ServiceWorkerRegistration />
        <SimulatorProvider>
          <NotificationManager />
          <LiveEventToast />
          <AuthSentinel>
            {children}
          </AuthSentinel>
        </SimulatorProvider>
      </body>
    </html>
  );
}
