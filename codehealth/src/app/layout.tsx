import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CodeHealth — Understand your codebase. Improve it with confidence.",
  description:
    "AI-powered developer workflow assistant that analyzes GitHub repositories and provides a unified view of codebase health.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="h-full" style={{ background: "#0B0B0C", color: "#F0F0F2" }}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
