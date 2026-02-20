import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Verifidia — The AI Encyclopedia",
  description: "Open-source AI-generated encyclopedia with full transparency",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
