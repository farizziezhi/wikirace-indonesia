import type { Metadata } from "next";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ roomId: string }>;
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { roomId } = await params;
  const upperRoomId = roomId.toUpperCase();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://wikiraceid.web.id";

  return {
    title: `Room ${upperRoomId}`,
    description: `Ikuti balapan WikiRace Indonesia di room ${upperRoomId}. Temukan rute artikel terpendek secepat mungkin!`,
    alternates: {
      canonical: `${baseUrl}/room/${roomId.toLowerCase()}`,
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default function RoomLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
