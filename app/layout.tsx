import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
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
  metadataBase: new URL('https://atbriz.com'),
  title: {
    default: 'atbriz — Connect with Uganda\'s Rising Artists & Discover New Music',
    template: '%s | atbriz',
  },
  description:
    'atbriz is Uganda\'s premier artist platform where musicians create profiles, showcase their music, display management contacts, and connect with fans. Discover, stream, and promote Ugandan talent.',
  keywords: [
    'Ugandan music',
    'Uganda artists',
    'Afrobeats Uganda',
    'upcoming Ugandan musicians',
    'Ugandan music platform',
    'artist discovery Uganda',
    'music promotion Uganda',
    'Kampala music scene',
    'atbriz',
    'Uganda artist profiles',
    'music streaming Uganda',
    'artist management contacts',
    'Ugandan musicians',
  ],
  authors: [{ name: 'atbriz' }],
  creator: 'atbriz',
  publisher: 'atbriz',
  openGraph: {
    type: 'website',
    locale: 'en_UG',
    url: 'https://atbriz.com',
    siteName: 'atbriz',
    title: "atbriz — Connect with Uganda's Rising Artists & Discover New Music",
    description:
      "Create your artist profile, upload music, showcase management contacts, and connect with fans. Uganda's premier platform for musicians and music discovery.",
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'atbriz — Uganda\'s Artist Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "atbriz — Connect with Uganda's Rising Artists & Discover New Music",
    description:
      "Create your artist profile, upload music, showcase management contacts, and connect with fans. Uganda's premier platform for musicians.",
    images: ['/og-image.png'],
    creator: '@atbriz',
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
    '@type': 'MusicEvent',
    name: 'atbriz',
    description: 'Uganda\'s premier artist platform where musicians create profiles, upload music, and connect with fans and industry professionals.',
    url: 'https://atbriz.com',
    location: {
      '@type': 'Place',
      name: 'Uganda',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'UG',
      },
    },
    organizer: {
      '@type': 'Organization',
      name: 'atbriz',
      url: 'https://atbriz.com',
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
        {children}
      </body>
    </html>
  );
}
