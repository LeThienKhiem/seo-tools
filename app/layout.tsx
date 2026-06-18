import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import { Sidebar } from "@/components/Sidebar";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sentry — SEO Workbench",
  description: "AI-powered SEO analysis, generation, and monitoring for any website.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${serif.variable}`}>
      <body>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 min-w-0">
            <div className="max-w-5xl mx-auto px-6 md:px-10 py-10 animate-fade-in">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
