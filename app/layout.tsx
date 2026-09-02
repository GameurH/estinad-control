import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ESTINAD Control",
    template: "%s · ESTINAD Control",
  },
  description:
    "Commercial and licensing control plane for the ESTINAD ecosystem — internal operations console.",
};

/**
 * Applies the stored theme (or the OS preference) before first paint so the
 * correct token set is active immediately — no flash of the wrong theme.
 */
const themeInitScript = `(function(){try{var s=localStorage.getItem("estinad-theme");var dark=s?s==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;var c=document.documentElement.classList;dark?c.add("dark"):c.add("light");}catch(e){document.documentElement.classList.add("dark");}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
