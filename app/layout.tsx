import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stellar Agent Layer",
  description:
    "Real AI Agent + Intent Engine + Tool Calling on Stellar Testnet. Wallet, Contact, Payment & History Engines with human-in-the-loop confirmation.",
};

const clerkEnabled = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith("pk_")
);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const body = (
    <html lang="es">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );

  if (!clerkEnabled) {
    return body;
  }

  // Dynamic require keeps the module optional at build time when keys are absent
  const { ClerkProvider } = require("@clerk/nextjs");

  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#22d3ee",
          colorBackground: "#0a0f1a",
          colorInputBackground: "#111827",
          colorInputText: "#e5e7eb",
          colorText: "#e5e7eb",
          colorTextSecondary: "#9ca3af",
          borderRadius: "0.75rem",
        },
        elements: {
          card: "bg-[#111827] border border-[#1f2937]",
          headerTitle: "text-white",
          headerSubtitle: "text-gray-400",
          socialButtonsBlockButton:
            "bg-gray-800 border-gray-700 text-white hover:bg-gray-700",
          formButtonPrimary: "bg-cyan-500 hover:bg-cyan-400 text-black",
          footerActionLink: "text-cyan-400 hover:text-cyan-300",
        },
      }}
    >
      {body}
    </ClerkProvider>
  );
}
