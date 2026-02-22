import type { Metadata } from "next";
import Script from "next/script";
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
  return (
    <>
      {children}
      <Script
        src="https://cdn.visitors.now/v.js"
        data-token="3611d496-d7ca-4f1d-a438-56cccc4b1bb9"
      />
    </>
  );
}
