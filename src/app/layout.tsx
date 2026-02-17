import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
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
  other: {
    "google-site-verification": "n1hnf0eSYURCqVqf47WVuvFxwQ2fNYpsVMIMp6ApGr4",
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
          <HeroUIProvider>
            <Toaster />
            {children}
          </HeroUIProvider>
        </body>
      </html>
    </GlobalProvider>
  )
}
