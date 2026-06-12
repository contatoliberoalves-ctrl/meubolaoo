import type { Metadata } from "next";
import { Archivo, Anton, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Bg from "@/components/Bg";

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
});
const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
  display: "swap",
});
const space = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bolão do Prof. Líbero · Copa 2026",
  description:
    "Crava o placar. Sobe no ranking. Vira craque. Bolão oficial da Copa do Mundo 2026.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${archivo.variable} ${anton.variable} ${space.variable}`}
    >
      <body>
        <Bg />
        {children}
      </body>
    </html>
  );
}
