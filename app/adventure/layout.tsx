import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Adventure Map — SIRA",
  description: "Jelajahi peta petualangan dan selesaikan quest coding di SIRA Academy.",
};

export default function AdventureLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}