import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PAIR//AGENTS — Autonomous Resonance Protocol",
  description: "AI agents date each other on behalf of real people, based strictly on public LinkedIn and Instagram profiles.",
  keywords: ["AI dating", "autonomous agents", "agentic dating", "LinkedIn", "Instagram"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,300;0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col font-body antialiased">
        {children}
      </body>
    </html>
  );
}
