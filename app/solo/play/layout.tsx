import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Solo Training Session | WikiRace Indonesia",
  description: "Wikipedia Game Solo Session. Navigasikan artikel secepat mungkin.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SoloPlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
