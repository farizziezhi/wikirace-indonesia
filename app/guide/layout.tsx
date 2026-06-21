import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Game Guide & Manual | WikiRace Indonesia",
  description: "Panduan lengkap cara bermain game Wikipedia (WikiRace Indonesia) baik solo latihan, ranked ELO matchmaking, maupun lobi mabar kustom.",
  alternates: {
    canonical: "/guide",
  },
};

export default function GuideLayout({ children }: { children: React.ReactNode }) {
  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "Cara Bermain WikiRace Indonesia (Wikipedia Game)",
    "description": "Panduan langkah-demi-langkah bermain game Wikipedia (WikiRace Indonesia) untuk latihan solo, ranked matchmaking, dan room mabar kustom.",
    "step": [
      {
        "@type": "HowToStep",
        "name": "Isi Nama & Mulai",
        "text": "Masukkan nama Anda secara instan di halaman utama atau masuk menggunakan Google OAuth untuk menyimpan statistik dan rating ELO."
      },
      {
        "@type": "HowToStep",
        "name": "Pilih Mode Permainan",
        "text": "Pilih mode Ranked untuk bermain kompetitif 1v1, Mabar kustom untuk bermain bersama teman, atau Solo Training untuk latihan."
      },
      {
        "@type": "HowToStep",
        "name": "Temukan Tautan Wikipedia",
        "text": "Jelajahi artikel Wikipedia hanya dengan mengklik link biru di dalam teks artikel tanpa menggunakan kolom pencarian eksternal sampai Anda mencapai target."
      },
      {
        "@type": "HowToStep",
        "name": "Gunakan Strategi Artikel Penghubung",
        "text": "Gunakan artikel hub besar seperti negara, benua, atau abad untuk menghubungkan dan melompati kategori topik yang jauh dengan cepat."
      }
    ],
    "totalTime": "PT5M"
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
      {children}
    </>
  );
}
