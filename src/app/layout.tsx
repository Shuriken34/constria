import type { Metadata } from "next";
import { Anton, Figtree } from "next/font/google";
import "./globals.css";

const anton = Anton({
  variable: "--font-anton",
  weight: "400",
  subsets: ["latin", "latin-ext"],
});

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "Constria — acoperișuri, garduri, foișoare și terase",
  description:
    "Constria construiește acoperișuri noi, schimbă și vopsește acoperișuri, montează garduri de orice tip și construiește foișoare și terase. Cere o ofertă.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ro" className={`${anton.variable} ${figtree.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* Marchează că JS rulează, ca elementele animate să pornească ascunse fără să clipească */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
