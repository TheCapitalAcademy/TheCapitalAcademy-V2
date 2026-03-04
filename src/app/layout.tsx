import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './global.css'
import GlobalProvider from './GlobalProvider'
import { Toaster } from 'react-hot-toast'
import { HeroUIProvider } from "@heroui/system";
import siteMetadata from '@/utils/siteMetaData'



const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'], display: 'swap' });

export const metadata = {
  metadataBase: new URL(siteMetadata.siteUrl),
  title: {
    template: `%s | ${siteMetadata.title}`,
    default: siteMetadata.title, // a default is required when creating a template
  },
  description: siteMetadata.description,
  keywords: [
    "MDCAT preparation",
    "NUMS entry test",
    "MDCAT 2025",
    "NUMS 2025 syllabus",
    "medical entrance exam Pakistan",
    "MDCAT online classes",
    "MDCAT past papers",
    "NUMS practice tests",
    "best academy for MDCAT",
    "online medical coaching Pakistan",
    "The Capital Academy",
    "NUMS test preparation",
    "PMC MDCAT preparation",
    "MDCAT test series",
    "NUMS mock tests",
    "FSc pre-medical tuition",
    "competitive exam preparation",
    "MDCAT preparation Karachi",
    "MDCAT biology chemistry physics",
    "MDCAT English grammar practice"
  ],
  openGraph: {
    title: siteMetadata.title,
    description: siteMetadata.description,
    url: siteMetadata.siteUrl,
    siteName: siteMetadata.title,
    images: [siteMetadata.socialBanner],
    locale: "en_US",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  twitter: {
    card: "summary_large_image",
    title: siteMetadata.title,
    images: [siteMetadata.socialBanner],
  },
  alternates: {
    canonical: siteMetadata.siteUrl,
  },
  other: {
    "google-site-verification": "3meUMtRdkL251La5YOyV0-pnDeBxqK0Y0rN5w-4hj5E",
  },
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

//defines the root layout of the system
  return (
    <GlobalProvider>
      <html lang="en">
        <body className={inter.className}>
          {/* Google Tag Manager (noscript) */}
          <noscript>
            <iframe 
              src="https://www.googletagmanager.com/ns.html?id=GTM-MD2RSR59"
              height="0" 
              width="0" 
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
          {/* End Google Tag Manager (noscript) */}
          
          {/* Google Tag Manager */}
          <Script id="google-tag-manager" strategy="afterInteractive">
            {`
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-MD2RSR59');
            `}
          </Script>
          {/* End Google Tag Manager */}

          {/* Google Analytics */}
          <Script
            src="https://www.googletagmanager.com/gtag/js?id=G-WTBF5ZHT6R"
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-WTBF5ZHT6R');
            `}
          </Script>
          {/* End Google Analytics */}
          
          <HeroUIProvider>
            <Toaster />
            {children}
          </HeroUIProvider>
        </body>
      </html>
    </GlobalProvider>
  )
}
