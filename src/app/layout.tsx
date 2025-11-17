import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EMall - Local Merchants Marketplace",
  description: "Connect with local merchants and shop from their brands",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
