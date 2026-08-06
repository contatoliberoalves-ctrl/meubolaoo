import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Primeiros Passos do Jovem Advogado",
  description: "Plataforma do Workshop — Primeiros Passos do Jovem Advogado",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
