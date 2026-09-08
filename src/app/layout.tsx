import type { Metadata, Viewport } from "next";
import Image from "next/image";
import { Geist, Geist_Mono, Cinzel } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#060d1d",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://eea-afrique.org"),
  title: "Étudiant Entrepreneuriat Afrique (EEA) | Plateforme Officielle",
  description:
    "Organisation reconnue par l'État. Projet né en 2008 à l'UCAD de Dakar et officiellement entré en activité opérationnelle en 2026. Fédérer les étudiants d'Afrique et de la diaspora autour de projets d'entrepreneuriat, de technologie et d'agriculture moderne.",
  keywords: [
    "EEA",
    "Étudiant Entrepreneuriat Afrique",
    "Entrepreneuriat étudiant",
    "Afrique",
    "Agrobusiness",
    "Tech Afrique",
    "Carte membre EEA",
    "UCAD Dakar",
    "Badge vérifié",
  ],
  icons: {
    icon: [
      { url: "/logo-eea.jpg", type: "image/jpeg" },
    ],
    apple: [
      { url: "/logo-eea.jpg" },
    ],
    shortcut: ["/logo-eea.jpg"],
  },
  openGraph: {
    title: "Étudiant Entrepreneuriat Afrique (EEA) | Plateforme Officielle",
    description:
      "Organisation panafricaine initiée en 2008 à l'UCAD de Dakar. Fédérer l'élite estudiantine africaine en Tech & Agrobusiness. Carte officielle de membre sécurisée par QR Code.",
    url: "https://eea-afrique.org",
    siteName: "EEA - Étudiant Entrepreneuriat Afrique",
    images: [
      {
        url: "/logo-eea.jpg",
        width: 800,
        height: 800,
        alt: "Logo Officiel EEA - Étudiant Entrepreneuriat Afrique",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Étudiant Entrepreneuriat Afrique (EEA)",
    description:
      "Plateforme officielle de l'Étudiant Entrepreneuriat Afrique. Carte de membre sécurisée par QR Code.",
    images: ["/logo-eea.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} ${cinzel.variable} h-full antialiased selection:bg-[#D4AF37] selection:text-[#060d1d] overflow-x-hidden`}
    >
      <body className="min-h-full flex flex-col bg-[#060d1d] text-[#f8fafc] overflow-x-hidden w-full max-w-[100vw] relative">
        {/* Global Fixed UCAD Library Heritage Background */}
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
          <Image
            src="/ucad-library.jpg"
            alt="Bibliothèque Centrale UCAD en arrière-plan"
            fill
            priority
            className="object-cover object-center opacity-75 scale-105 filter saturate-90 contrast-125"
          />
          {/* Nocturnal Deep Blue Scrim & Vignette Gradients */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#060d1d]/65 via-[#08142c]/55 to-[#060d1d]/75" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_10%,#060d1d_85%)] opacity-55" />
        </div>

        <SmoothScroll>
          <Navbar />
          <main className="flex-1 w-full overflow-x-hidden">{children}</main>
          <Footer />
          <WhatsAppButton />
        </SmoothScroll>
      </body>
    </html>
  );
}
