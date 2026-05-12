import type { Metadata } from "next";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "MathPivot — Structured Math Coaching for Ambitious Students",
    template: "%s | MathPivot",
  },
  description:
    "Named coaches, mastery tracking, and competition prep. MathPivot is the travel ball of math — structured coaching programs that build confidence, skill, and career-ready thinking.",
  openGraph: {
    title: "MathPivot — The Travel Ball of Math",
    description:
      "Structured math coaching with named coaches, mastery tracking, Mathathlon competitions, and career exposure. Not hourly tutoring — a development pathway.",
    siteName: "MathPivot",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
