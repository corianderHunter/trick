import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TRICK",
  description: "TRICK",
};

import ConditionalHeader from "@/components/ConditionalHeader";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased font-sans">
        <ConditionalHeader />
        {children}
      </body>
    </html>
  );
}
