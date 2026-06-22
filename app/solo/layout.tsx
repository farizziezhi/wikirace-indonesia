import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Solo Training Mode",
  description:
    "Latih kecepatan Anda berselancar di Wikipedia dalam mode solo training gratis. Pilih tema favorit Anda dan capai artikel tujuan secepat mungkin.",
  alternates: {
    canonical: "/solo",
  },
};

export default function SoloLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
