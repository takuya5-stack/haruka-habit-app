import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Haruka習慣アプリ",
  description: "毎日の勉強を記録しよう",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
