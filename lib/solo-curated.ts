import type { WikiLanguage } from "./types";

export type SoloTheme = "all" | "history-geo" | "pop-culture" | "science-tech" | "sports-games" | "general";

export interface ThemeConfig {
  value: SoloTheme;
  labelId: string;
  labelEn: string;
  emoji: string;
}

export const SOLO_THEMES: ThemeConfig[] = [
  { value: "all", labelId: "Wikipedia Liar", labelEn: "Wild Wikipedia", emoji: "🌀" },
  { value: "history-geo", labelId: "Sejarah & Geografi", labelEn: "History & Geography", emoji: "🌎" },
  { value: "pop-culture", labelId: "Seni & Budaya", labelEn: "Art & Pop Culture", emoji: "🎨" },
  { value: "science-tech", labelId: "Sains & Teknologi", labelEn: "Science & Tech", emoji: "🚀" },
  { value: "sports-games", labelId: "Olahraga & Game", labelEn: "Sports & Games", emoji: "⚽" },
  { value: "general", labelId: "Umum & Klasik", labelEn: "General Knowledge", emoji: "🎲" },
];

export const CURATED_ARTICLES: Record<WikiLanguage, Record<Exclude<SoloTheme, "all">, string[]>> = {
  id: {
    "history-geo": [
      "Indonesia", "Jakarta", "Candi Borobudur", "Perang Dunia II", "Kekaisaran Romawi",
      "Mesir Kuno", "Candi Prambanan", "Jepang", "Amerika Serikat", "Kerajaan Majapahit",
      "Belanda", "Bandung", "Surabaya", "Asia Tenggara", "Eropa", "Afrika", "Australia",
      "Kekaisaran Mongol", "Revolusi Prancis", "Pramoedya Ananta Toer", "Soekarno", "Gajah Mada"
    ],
    "pop-culture": [
      "Mona Lisa", "Michael Jackson", "Batik", "Anime", "Harry Potter", "Hollywood",
      "The Beatles", "Leonardo da Vinci", "Wayang", "Film", "Musik", "Seni rupa",
      "Grammy Awards", "Marvel Cinematic Universe", "Star Wars", "Sherlock Holmes", "Candi Penataran"
    ],
    "science-tech": [
      "Internet", "Albert Einstein", "Kecerdasan buatan", "Planet", "NASA", "SpaceX",
      "Bill Gates", "Steve Jobs", "Bitcoin", "Matematika", "Fisika", "Kimia", "DNA",
      "Bumi", "Bulan", "Telepon genggam", "Komputer", "Teori relativitas", "Thomas Alva Edison"
    ],
    "sports-games": [
      "Sepak bola", "Cristiano Ronaldo", "Lionel Messi", "Bulu tangkis", "Formula 1",
      "FIFA World Cup", "Bola basket", "Catur", "Minecraft", "PlayStation", "YouTube",
      "TikTok", "Sega", "Nintendo", "Olimpiade Musim Panas", "Valentino Rossi"
    ],
    "general": [
      "Kopi", "Kucing", "Air", "Uang", "Makanan", "Samudra", "Bahasa Indonesia",
      "Teh", "Cokelat", "Anjing", "Emas", "Garam", "Pohon", "Bunga", "Kertas", "Buku"
    ]
  },
  en: {
    "history-geo": [
      "United States", "United Kingdom", "World War II", "Ancient Egypt", "Roman Empire",
      "London", "Europe", "Japan", "Earth", "Asia", "Africa", "Australia", "New York City",
      "Julius Caesar", "French Revolution", "Mongol Empire", "Alexander the Great", "Rome"
    ],
    "pop-culture": [
      "Mona Lisa", "Michael Jackson", "Anime", "Harry Potter", "Hollywood", "The Beatles",
      "Leonardo da Vinci", "William Shakespeare", "Cinema", "Music", "Art",
      "Grammy Award", "Marvel Cinematic Universe", "Star Wars", "Sherlock Holmes", "Pop music"
    ],
    "science-tech": [
      "Internet", "Albert Einstein", "Artificial intelligence", "Planet", "NASA", "SpaceX",
      "Bill Gates", "Steve Jobs", "Bitcoin", "Mathematics", "Physics", "Chemistry", "DNA",
      "Moon", "Mobile phone", "Computer", "Theory of relativity", "Thomas Edison"
    ],
    "sports-games": [
      "Association football", "Cristiano Ronaldo", "Lionel Messi", "Formula One",
      "FIFA World Cup", "Basketball", "Chess", "Minecraft", "PlayStation", "YouTube",
      "TikTok", "Sega", "Nintendo", "Olympic Games", "Super Mario"
    ],
    "general": [
      "Coffee", "Cat", "Water", "Money", "Food", "Ocean", "English language",
      "Tea", "Chocolate", "Dog", "Gold", "Salt", "Tree", "Flower", "Paper", "Book"
    ]
  }
};

/**
  * Get all curated articles for a given language flat mapped.
  */
export function getAllCuratedArticles(lang: WikiLanguage): string[] {
  return Object.values(CURATED_ARTICLES[lang]).flat();
}
