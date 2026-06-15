/**
* Daftar nama samaran pemain yang realistis (Indonesia & Inggris) untuk bot.
*/
const BOT_NAMES = [
  // Indonesian
  "fauzan_aditya",
  "rizky_pratama",
  "budi_santoso",
  "anggawijaya",
  "dian_putri",
  "wulan_sari",
  "eko_purnomo",
  "lestari_andini",
  "hendra_kusuma",
  "bagus_prasetyo",
  "joko_susilo",
  "siti_nurhayati",
  "megawati_putri",
  "adi_nugraha",
  "kartika_sari",
  "ramadhan_dwi",
  "faisal_rachman",
  "anisa_fitria",
  "tulus_setiawan",
  "citra_lestari",
  "gilang_ramadhan",
  "arif_budiman",
  "wahyu_hidayat",
  "sari_indriati",
  "putra_perdana",
  "agus_setiawan",
  "ratna_sari",
  "riyan_hidayat",
  "nurul_azizah",
  "dimas_saputra",
  // English / International
  "alex_speedrun",
  "wikimaster99",
  "sarah_connor",
  "john_doe_92",
  "lisa_keller",
  "ryan_jones",
  "emily_watson",
  "david_clark",
  "wikihiker",
  "chloe_miller",
  "kevin_smith",
  "speedy_gonzales",
  "james_carter",
  "jessica_taylor",
  "daniel_brown",
  "matthew_d",
  "olivia_green",
  "william_b",
  "sophia_roberts",
  "lucas_m",
  "emma_jones",
  "michael_s",
  "olivia_w",
  "ethan_hunt",
  "tom_hiker",
  "charlotte_b",
  "speedrun_dan",
  "hyper_clicker",
  "wiki_racer_pro",
  "road_to_end"
];

/**
 * Mengembalikan nama bot secara acak yang belum digunakan oleh pemain lain.
 * 
 * @param excludeNames Daftar nama yang tidak boleh dipilih (sudah dipakai pemain lain).
 */
export function getRandomBotName(excludeNames: string[] = []): string {
  const lowerExcludes = excludeNames.map((n) => n.toLowerCase());
  const candidates = BOT_NAMES.filter((name) => !lowerExcludes.includes(name.toLowerCase()));
  
  if (candidates.length === 0) {
    // Fallback jika semua nama ter-exclude (sangat tidak mungkin)
    return `Pemain_${Math.floor(100 + Math.random() * 900)}`;
  }
  
  return candidates[Math.floor(Math.random() * candidates.length)];
}
