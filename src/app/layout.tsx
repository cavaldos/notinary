import type { Metadata } from "next";
import "./globals.css";
import ProviderGlobal from "../redux/provider";
import Navbar from "../components/nav";
export const metadata: Metadata = {
  title: "Notirary",
  description: "A Notion-like app for vocabulary learning",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Notirary",
    description: "A Notion-like app for vocabulary learning",
    url: "https://notirary.vercel.app",
    siteName: "Notirary",
    images: [
      {
        url: "https://notirary.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "Notirary - Vocabulary Learning App",
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">

      <body
        className="antialiased"
        suppressHydrationWarning={true}
      >
        <ProviderGlobal>
          <div className="flex flex-col h-screen bg-notion-background">
            {children}
            <Navbar />
          </div>
        </ProviderGlobal>
      </body>
    </html>
  );
}
