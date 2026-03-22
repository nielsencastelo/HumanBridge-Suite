import "./globals.css";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "HumanBridge Suite",
  description: "BridgeForm + ReadBuddy",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <header className="topbar">
          <div className="container topbar-inner">
            <Link href="/" className="brand">
              HumanBridge Suite
            </Link>
            <nav className="nav">
              <Link href="/">Início</Link>
              <Link href="/translator">BridgeForm</Link>
              <Link href="/readbuddy">ReadBuddy</Link>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
