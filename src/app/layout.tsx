import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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

export const metadata: Metadata = {
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
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased selection:bg-[#D4AF37] selection:text-[#060d1d]`}
    >
      <body className="min-h-full flex flex-col bg-[#060d1d] text-[#f8fafc]">
        <SmoothScroll>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <WhatsAppButton />
        </SmoothScroll>
      </body>
    </html>
  );
}
