import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Tinlance Extensions Architecture Spike",
  description: "Isolated Next.js App Router build feasibility proof."
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
