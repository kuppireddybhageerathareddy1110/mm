import type { Metadata } from "next";
import "../../globals.css";

export const metadata: Metadata = {
  title: "Sentiment Studio",
  description: "Explainable AI sentiment analysis with FastAPI and Next.js"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
