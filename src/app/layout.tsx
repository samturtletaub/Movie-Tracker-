import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/nav";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";

export const metadata: Metadata = {
  title: "Reel — your cinematic library",
  description:
    "Track what you've watched, rate it fast, and find what to watch next.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-ink-950 text-ink-100">
        <Nav />
        <main className="relative z-10">{children}</main>
        <KeyboardShortcuts />
      </body>
    </html>
  );
}
