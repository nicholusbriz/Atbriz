import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Providers from '@/components/providers';
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
  metadataBase: new URL('https://voiceug.com'),
  title: {
    default: 'VoiceUG — Uganda Citizen Complaints & Feedback Platform',
    template: '%s | VoiceUG',
  },
  description:
    'VoiceUG is Uganda\'s citizen feedback platform. Report health worker absence, broken roads, missing drugs, corrupt officials and more — directly to your district office.',
  keywords: [
    'Uganda citizen complaints',
    'report government Uganda',
    'Uganda health worker absent',
    'Uganda road repair',
    'district complaints Uganda',
    'civic tech Uganda',
    'VoiceUG',
    'Uganda accountability platform',
    'report corruption Uganda',
    'citizen feedback Uganda',
    'Uganda government services',
    'district officials Uganda',
  ],
  authors: [{ name: 'VoiceUG' }],
  creator: 'VoiceUG',
  publisher: 'VoiceUG',
  openGraph: {
    type: 'website',
    locale: 'en_UG',
    url: 'https://voiceug.com',
    siteName: 'VoiceUG',
    title: "VoiceUG — Uganda's Citizen Complaints Platform",
    description:
      "Report. Track. Get it Fixed. Submit complaints about health, roads, education or corruption directly to the right district official.",
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'VoiceUG — citizen reporting across Uganda',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "VoiceUG — Uganda's Citizen Complaints Platform",
    description:
      "Report health worker absence, broken roads, missing drugs and corruption directly to your district office.",
    images: ['/og-image.png'],
    creator: '@voiceug',
  },
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'VoiceUG',
    description: "Uganda's citizen complaints and government accountability platform.",
    url: 'https://voiceug.com',
    applicationCategory: 'GovernmentApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'UGX',
    },
    creator: {
      '@type': 'Organization',
      name: 'VoiceUG',
      url: 'https://voiceug.com',
    },
    location: {
      '@type': 'Place',
      name: 'Uganda',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'UG',
      },
    },
  };

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      style={{ height: '100dvh' }}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body style={{ background: 'var(--bg)', color: 'var(--t1)', height: '100%' }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
