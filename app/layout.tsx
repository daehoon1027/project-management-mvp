import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Project Management MVP",
  description: "Hierarchical project and task management web app MVP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
