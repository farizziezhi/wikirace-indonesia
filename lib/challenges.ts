import type { WikiLanguage } from "./types";

export interface ChallengePackEntry {
  id: string;
  name: string;
  description: string;
  startArticle: string;
  endArticle: string;
  lang: WikiLanguage;
  difficulty: "easy" | "medium" | "hard";
}

export const CHALLENGE_PACKS: ChallengePackEntry[] = [
  // Indonesian Geography
  {
    id: "geography-id-1",
    name: "Pulau ke Pulau",
    description: "Jelajahi kepulauan Indonesia",
    startArticle: "Jakarta",
    endArticle: "Bali",
    lang: "id",
    difficulty: "easy",
  },
  {
    id: "geography-id-2",
    name: "Kota Besar",
    description: "Dari metropolis ke kota bersejarah",
    startArticle: "Bandung",
    endArticle: "Yogyakarta (kota)",
    lang: "id",
    difficulty: "easy",
  },
  {
    id: "geography-id-3",
    name: "Nusantara Timur",
    description: "Petualangan ke timur Indonesia",
    startArticle: "Makassar",
    endArticle: "Papua",
    lang: "id",
    difficulty: "medium",
  },

  // Indonesian History
  {
    id: "history-id-1",
    name: "Tokoh Pendiri",
    description: "Dari proklamator ke republik",
    startArticle: "Soekarno",
    endArticle: "Indonesia",
    lang: "id",
    difficulty: "medium",
  },
  {
    id: "history-id-2",
    name: "Era Kerajaan",
    description: "Jejak kerajaan Nusantara",
    startArticle: "Majapahit",
    endArticle: "Sriwijaya",
    lang: "id",
    difficulty: "hard",
  },
  {
    id: "history-id-3",
    name: "Perjuangan Kemerdekaan",
    description: "Jejak perjuangan 1945",
    startArticle: "Proklamasi Kemerdekaan Indonesia",
    endArticle: "Soeharto",
    lang: "id",
    difficulty: "medium",
  },

  // Indonesian Culture
  {
    id: "culture-id-1",
    name: "Seni Tradisional",
    description: "Wayang hingga tarian daerah",
    startArticle: "Wayang",
    endArticle: "Tari Bali",
    lang: "id",
    difficulty: "easy",
  },
  {
    id: "culture-id-2",
    name: "Kuliner Nusantara",
    description: "Petualangan rasa Indonesia",
    startArticle: "Nasi goreng",
    endArticle: "Rendang",
    lang: "id",
    difficulty: "easy",
  },

  // English Geography
  {
    id: "geography-en-1",
    name: "European Tour",
    description: "Travel across European capitals",
    startArticle: "London",
    endArticle: "Paris",
    lang: "en",
    difficulty: "easy",
  },
  {
    id: "geography-en-2",
    name: "American Journey",
    description: "Coast to coast USA",
    startArticle: "New York City",
    endArticle: "Los Angeles",
    lang: "en",
    difficulty: "easy",
  },

  // English History
  {
    id: "history-en-1",
    name: "Ancient Empires",
    description: "From republic to empire",
    startArticle: "Roman Republic",
    endArticle: "Roman Empire",
    lang: "en",
    difficulty: "medium",
  },
  {
    id: "history-en-2",
    name: "Scientific Revolution",
    description: "Minds that changed the world",
    startArticle: "Isaac Newton",
    endArticle: "Albert Einstein",
    lang: "en",
    difficulty: "medium",
  },

  // English Science
  {
    id: "science-en-1",
    name: "Space Race",
    description: "Journey through the cosmos",
    startArticle: "Moon",
    endArticle: "Mars",
    lang: "en",
    difficulty: "easy",
  },
  {
    id: "science-en-2",
    name: "Tech Giants",
    description: "From garage to global",
    startArticle: "Steve Jobs",
    endArticle: "Bill Gates",
    lang: "en",
    difficulty: "easy",
  },
];

export function getChallengePackById(id: string): ChallengePackEntry | undefined {
  return CHALLENGE_PACKS.find((p) => p.id === id);
}

export function getPacksByLanguage(lang: WikiLanguage): ChallengePackEntry[] {
  return CHALLENGE_PACKS.filter((p) => p.lang === lang);
}

export function getPacksByDifficulty(
  difficulty: "easy" | "medium" | "hard",
): ChallengePackEntry[] {
  return CHALLENGE_PACKS.filter((p) => p.difficulty === difficulty);
}
