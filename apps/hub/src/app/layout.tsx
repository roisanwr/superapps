import type { Metadata } from "next";
import { Inter, Noto_Serif } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const notoSerif = Noto_Serif({
  variable: "--font-noto-serif",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Architectural Editorial | The Editorial Flow",
  description: "Digital experiences where clean code meets intentional design.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${notoSerif.variable} ${inter.variable} h-full antialiased light`}
    >
      <body className="bg-surface text-on-surface antialiased font-body min-h-full flex flex-col">{children}</body>
    </html>
  );
}
