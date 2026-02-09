import "@/app/globals.css";
import Navbar from "@/components/Navbar";
import { getSiteUrl } from "@/utils/site";
import type { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  manifest: '/manifest.webmanifest',
  title: {
    default: "Meier Open - Bierpong Turnier",
    template: "%s | Meier Open",
  },
  description: "Offizielle Website des Meier Open Bierpong-Turniers",
  openGraph: {
    type: "website",
    locale: "de_DE",
    title: "Meier Open - Bierpong Turnier",
    description: "Offizielle Website des Meier Open Bierpong-Turniers",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Meier Open - Bierpong Turnier",
    description: "Offizielle Website des Meier Open Bierpong-Turniers",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de">
      <body className="antialiased">
        <Navbar />
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}
