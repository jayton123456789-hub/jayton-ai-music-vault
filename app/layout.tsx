import type { Metadata } from "next";
import { Sora } from "next/font/google";

import "@/app/globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora"
});

export const metadata: Metadata = {
  title: "Jayton Music Vault",
  description: "Premium music portal with identity-gated access."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sora.variable} bg-night font-sans text-slate-100 antialiased`}>
        {children}
      </body>
    </html>
  );
}
