import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Verifidia — The AI Encyclopedia",
  description: "Open-source AI-generated encyclopedia with full transparency",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
