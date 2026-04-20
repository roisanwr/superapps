import type { Metadata } from "next";
import "./globals.css";
import { BottomNav } from "@superapp/ui";
import { LayoutDashboard, Wallet, Sword } from "lucide-react";

export const metadata: Metadata = {
  title: "BitMove — Gamified Productivity",
  description: "RPG-style self-discipline and productivity system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark selection:bg-primary selection:text-black">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&family=Rajdhani:wght@400;500;600;700&family=Barlow+Condensed:ital,wght@0,400;0,600;0,700;0,800;1,700;1,800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="pb-16 md:pb-0">
        {children}
        <BottomNav 
          items={[
            { label: "Hub", href: "/", icon: <LayoutDashboard className="w-full h-full" /> },
            { label: "Finance", href: "/finance", icon: <Wallet className="w-full h-full" /> },
            { label: "Quests", href: "/quests", icon: <Sword className="w-full h-full" />, isActive: true },
          ]}
        />
      </body>
    </html>
  );
}
