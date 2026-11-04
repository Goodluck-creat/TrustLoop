import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TrustLoop",
  description: "Get paid for work. Prove it forever.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}