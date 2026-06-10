export interface PlayerEloData {
  username: string;
  elo: number;
  status: "finished" | "surrendered" | "playing" | "waiting";
  finishedAt?: number; // timestamp ms
}

const K_FACTOR = 32;

/**
 * Menghitung perubahan ELO untuk seluruh pemain dalam satu permainan.
 * Membandingkan setiap pemain secara 1v1 (pairwise) dengan pemain lain,
 * lalu merata-rata perubahan ELO untuk menjaga keseimbangan.
 */
export function calculateEloChanges(players: PlayerEloData[]): Record<string, number> {
  const n = players.length;
  const eloChanges: Record<string, number> = {};

  // Inisialisasi perubahan ELO = 0 untuk semua pemain
  for (const p of players) {
    eloChanges[p.username] = 0;
  }

  if (n < 2) return eloChanges;

  // 1. Tentukan ranking/skor relatif tiap pasangan pemain (i, j)
  // i mengalahkan j jika:
  // - i berstatus 'finished' dan j tidak (surrendered/playing/waiting).
  // - Keduanya 'finished' tapi finishedAt i < finishedAt j (lebih cepat).
  // Keduanya seri jika:
  // - Keduanya berstatus non-finished (sama-sama menyerah/AFK).
  // - Keduanya finished pada milidetik yang sama persis (jarang terjadi).
  const getOutcome = (pI: PlayerEloData, pJ: PlayerEloData): number => {
    const iFinished = pI.status === "finished";
    const jFinished = pJ.status === "finished";

    if (iFinished && !jFinished) return 1; // i menang
    if (!iFinished && jFinished) return 0; // i kalah
    if (!iFinished && !jFinished) return 0.5; // Keduanya menyerah (seri)

    // Keduanya finished
    const timeI = pI.finishedAt || 0;
    const timeJ = pJ.finishedAt || 0;

    if (timeI < timeJ) return 1; // i lebih cepat (menang)
    if (timeI > timeJ) return 0; // j lebih cepat (kalah)
    return 0.5; // Seri
  };

  // 2. Hitung perubahan ELO berpasangan
  for (let i = 0; i < n; i++) {
    const pI = players[i];
    let totalDelta = 0;

    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const pJ = players[j];

      // Perkirakan kemenangan (expected score) i melawan j
      const expectedScore = 1 / (1 + Math.pow(10, (pJ.elo - pI.elo) / 400));
      // Hasil aktual i melawan j
      const actualScore = getOutcome(pI, pJ);

      // Delta ELO i melawan j
      const delta = K_FACTOR * (actualScore - expectedScore);
      totalDelta += delta;
    }

    // Rata-rata perubahan ELO terhadap n-1 lawan
    eloChanges[pI.username] = Math.round(totalDelta / (n - 1));
  }

  return eloChanges;
}
