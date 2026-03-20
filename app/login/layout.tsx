import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Masuk ke SIRA",
  description:
    "Login atau daftar akun SIRA untuk mulai petualangan belajar koding.",
  robots: "noindex",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}