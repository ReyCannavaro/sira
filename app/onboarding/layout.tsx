import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pilih Hero Class — SIRA",
  description: "Pilih jalur belajarmu dan mulai petualangan coding di SIRA Academy.",
  robots: "noindex",
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}