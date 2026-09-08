import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stellar Agent Layer",
  description:
    "Real AI Agent + Intent Engine + Tool Calling on Stellar Testnet. Wallet, Contact, Payment & History Engines with human-in-the-loop confirmation.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}