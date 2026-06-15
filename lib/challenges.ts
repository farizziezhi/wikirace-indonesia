import type { WikiLanguage } from "./types";

export interface ChallengePackEntry {
  id: string;
  name: string;
  description: string;
  startArticle: string;
  endArticle: string;
  lang: WikiLanguage;
  difficulty: "easy" | "medium" | "hard";
  solutionRoute?: string[];
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
    solutionRoute: [
        "Jakarta",
        "Daerah Khusus Ibukota Jakarta",
        "1950",
        "Bali"
    ],
  },
  {
    id: "geography-id-2",
    name: "Kota Besar",
    description: "Dari metropolis ke kota bersejarah",
    startArticle: "Bandung",
    endArticle: "Yogyakarta (kota)",
    lang: "id",
    difficulty: "easy",
    solutionRoute: [
        "Bandung",
        "Kota Bandung",
        "Daftar Gubernur Daerah Istimewa Yogyakarta",
        "Hamengkubuwana IX",
        "Yogyakarta (kota)"
    ],
  },
  {
    id: "geography-id-3",
    name: "Nusantara Timur",
    description: "Petualangan ke timur Indonesia",
    startArticle: "Makassar",
    endArticle: "Papua",
    lang: "id",
    difficulty: "medium",
    solutionRoute: [
        "Makassar",
        "Kota Makassar",
        "Bahasa Bugis",
        "Papua"
    ],
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
    solutionRoute: [
        "Soekarno",
        "Bali",
        "Indonesia"
    ],
  },
  {
    id: "history-id-2",
    name: "Era Kerajaan",
    description: "Jejak kerajaan Nusantara",
    startArticle: "Majapahit",
    endArticle: "Sriwijaya",
    lang: "id",
    difficulty: "hard",
    solutionRoute: [
        "Majapahit",
        "Indonesia",
        "Sriwijaya"
    ],
  },
  {
    id: "history-id-3",
    name: "Perjuangan Kemerdekaan",
    description: "Jejak perjuangan 1945",
    startArticle: "Proklamasi Kemerdekaan Indonesia",
    endArticle: "Soeharto",
    lang: "id",
    difficulty: "medium",
    solutionRoute: [
        "Proklamasi Kemerdekaan Indonesia",
        "Indonesia",
        "Soeharto"
    ],
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
    solutionRoute: [
        "Wayang",
        "Tari Bali"
    ],
  },
  {
    id: "culture-id-2",
    name: "Kuliner Nusantara",
    description: "Petualangan rasa Indonesia",
    startArticle: "Nasi goreng",
    endArticle: "Rendang",
    lang: "id",
    difficulty: "easy",
    solutionRoute: [
        "Nasi goreng",
        "Daging",
        "Rendang"
    ],
  },
  {
    id: "philosophy-id-1",
    name: "Filsafat Dunia",
    description: "Perjalanan logika dan pemikiran",
    startArticle: "Filsafat",
    endArticle: "Logika",
    lang: "id",
    difficulty: "hard",
    solutionRoute: [
        "Filsafat",
        "Logika"
    ],
  },
  {
    id: "tech-id-1",
    name: "Sistem Komputasi",
    description: "Dari sistem operasi ke cloud",
    startArticle: "Linux",
    endArticle: "Komputasi awan",
    lang: "id",
    difficulty: "hard",
    solutionRoute: [
        "Linux",
        "Komputasi awan"
    ],
  },

  // --- Tambahan Baru ID ---
  // Indonesian Food & Culture (Easy)
  {
    id: "food-id-3",
    name: "Makanan Pedas",
    description: "Pecinta sambal Nusantara",
    startArticle: "Sambal",
    endArticle: "Nasi padang",
    lang: "id",
    difficulty: "easy",
    solutionRoute: [
        "Sambal",
        "Ale-ale",
        "Makanan",
        "Nasi",
        "Nasi padang"
    ],
  },
  {
    id: "culture-id-3",
    name: "Transportasi Publik",
    description: "KRL Commuter Line ke TransJakarta",
    startArticle: "KRL Commuter Line",
    endArticle: "TransJakarta",
    lang: "id",
    difficulty: "easy",
    solutionRoute: [
        "KRL Commuter Line",
        "Angkutan Sungai Jakarta",
        "TransJakarta"
    ],
  },
  {
    id: "nature-id-1",
    name: "Flora & Fauna",
    description: "Makhluk unik khas Indonesia",
    startArticle: "Komodo",
    endArticle: "Rafflesia arnoldii",
    lang: "id",
    difficulty: "easy",
    solutionRoute: [
        "Komodo",
        "2006",
        "Kota Lubuk Linggau",
        "Kabupaten Bengkulu Utara",
        "Rafflesia arnoldii"
    ],
  },
  {
    id: "music-id-1",
    name: "Band Legendaris",
    description: "Dari era alternatif ke pop",
    startArticle: "Noah (grup musik)",
    endArticle: "Dewa 19",
    lang: "id",
    difficulty: "easy",
    solutionRoute: [
        "Noah (grup musik)",
        "Dewa 19"
    ],
  },
  // Indonesian History & Geography (Medium)
  {
    id: "history-id-4",
    name: "Perjuangan Jenderal",
    description: "Pahlawan nasional Indonesia",
    startArticle: "Soedirman",
    endArticle: "Diponegoro",
    lang: "id",
    difficulty: "medium",
    solutionRoute: [
        "Soedirman",
        "Indonesia",
        "Diponegoro"
    ],
  },
  {
    id: "nature-id-2",
    name: "Cincin Api Pasifik",
    description: "Gunung api aktif legendaris",
    startArticle: "Gunung Merapi",
    endArticle: "Krakatau",
    lang: "id",
    difficulty: "medium",
    solutionRoute: [
        "Gunung Merapi",
        "Gunung Kerinci",
        "Krakatau"
    ],
  },
  {
    id: "geography-id-4",
    name: "Dua Candi Agung",
    description: "Jelajah warisan wangsa kuno",
    startArticle: "Candi Prambanan",
    endArticle: "Borobudur",
    lang: "id",
    difficulty: "medium",
    solutionRoute: [
        "Candi Prambanan",
        "Borobudur"
    ],
  },
  {
    id: "culture-id-4",
    name: "Sastra & Puisi",
    description: "Pujangga Indonesia yang mendunia",
    startArticle: "Chairil Anwar",
    endArticle: "Pramoedya Ananta Toer",
    lang: "id",
    difficulty: "medium",
    solutionRoute: [
        "Chairil Anwar",
        "Pramoedya Ananta Toer"
    ],
  },
  // Indonesian Science & Mythology (Hard)
  {
    id: "myth-id-1",
    name: "Astronomi & Mitos",
    description: "Dari sains gerhana ke legenda pantai selatan",
    startArticle: "Gerhana matahari",
    endArticle: "Nyi Roro Kidul",
    lang: "id",
    difficulty: "hard",
    solutionRoute: [
        "Gerhana matahari",
        "Concorde",
        "24 Oktober",
        "11 September",
        "Nyi Roro Kidul"
    ],
  },
  {
    id: "tech-id-2",
    name: "Teknologi Maritim Kuno",
    description: "Senjata tradisional ke perahu layar",
    startArticle: "Keris",
    endArticle: "Pinisi",
    lang: "id",
    difficulty: "hard",
    solutionRoute: [
        "Keris",
        "Pinisi"
    ],
  },
  {
    id: "philosophy-id-2",
    name: "Semboyan Bangsa",
    description: "Dari dasar negara ke persatuan bangsa",
    startArticle: "Pancasila",
    endArticle: "Bhinneka Tunggal Ika",
    lang: "id",
    difficulty: "hard",
    solutionRoute: [
        "Pancasila",
        "Bhinneka Tunggal Ika"
    ],
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
    solutionRoute: [
        "London",
        "Amsterdam",
        "Paris"
    ],
  },
  {
    id: "geography-en-2",
    name: "American Journey",
    description: "Coast to coast USA",
    startArticle: "New York City",
    endArticle: "Los Angeles",
    lang: "en",
    difficulty: "easy",
    solutionRoute: [
        "New York City",
        "Los Angeles"
    ],
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
    solutionRoute: [
        "Roman Republic",
        "Roman Empire"
    ],
  },
  {
    id: "history-en-2",
    name: "Scientific Revolution",
    description: "Minds that changed the world",
    startArticle: "Isaac Newton",
    endArticle: "Albert Einstein",
    lang: "en",
    difficulty: "medium",
    solutionRoute: [
        "Isaac Newton",
        "Albert Einstein"
    ],
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
    solutionRoute: [
        "Moon",
        "Mars"
    ],
  },
  {
    id: "science-en-2",
    name: "Tech Giants",
    description: "From garage to global",
    startArticle: "Steve Jobs",
    endArticle: "Bill Gates",
    lang: "en",
    difficulty: "easy",
    solutionRoute: [
        "Steve Jobs",
        "Bill Gates"
    ],
  },
  {
    id: "science-en-3",
    name: "Advanced Science",
    description: "From counting numbers to the subatomic world",
    startArticle: "Mathematics",
    endArticle: "Quantum computing",
    lang: "en",
    difficulty: "hard",
    solutionRoute: [
        "Mathematics",
        "Algorithm",
        "Quantum computing"
    ],
  },
  {
    id: "philosophy-en-1",
    name: "Philosophy of Mind",
    description: "From socratic thought to AI machines",
    startArticle: "Socrates",
    endArticle: "Artificial intelligence",
    lang: "en",
    difficulty: "hard",
    solutionRoute: [
        "Socrates",
        "Baruch Spinoza",
        "Artificial intelligence"
    ],
  },

  // --- Tambahan Baru EN ---
  // English Food & Culture (Easy)
  {
    id: "food-en-1",
    name: "Fast Food Tour",
    description: "From burgers to Italian classics",
    startArticle: "McDonald's",
    endArticle: "Pizza",
    lang: "en",
    difficulty: "easy",
    solutionRoute: [
        "McDonald's",
        "Arthur Treacher's",
        "Pizza"
    ],
  },
  {
    id: "nature-en-1",
    name: "Man's Best Friends",
    description: "From household pets to animal doctors",
    startArticle: "Cat",
    endArticle: "Veterinary medicine",
    lang: "en",
    difficulty: "easy",
    solutionRoute: [
        "Cat",
        "Aspirin",
        "Veterinary medicine"
    ],
  },
  {
    id: "geography-en-3",
    name: "Global Capitals",
    description: "East meets West",
    startArticle: "Tokyo",
    endArticle: "Washington, D.C.",
    lang: "en",
    difficulty: "easy",
    solutionRoute: [
        "Tokyo",
        "Ankara",
        "Washington, D.C."
    ],
  },
  // English History & Science (Medium)
  {
    id: "myth-en-1",
    name: "Gods and Sagas",
    description: "From Olympus to Valhalla",
    startArticle: "Zeus",
    endArticle: "Norse mythology",
    lang: "en",
    difficulty: "medium",
    solutionRoute: [
        "Zeus",
        "Andromeda (mythology)",
        "Norse mythology"
    ],
  },
  {
    id: "science-en-4",
    name: "Space Exploration",
    description: "To the moon and beyond",
    startArticle: "Apollo 11",
    endArticle: "International Space Station",
    lang: "en",
    difficulty: "medium",
    solutionRoute: [
        "Apollo 11",
        "International Space Station"
    ],
  },
  {
    id: "history-en-3",
    name: "Age of Renaissance",
    description: "Artistic rebirth to modern astronomy",
    startArticle: "Renaissance",
    endArticle: "Galileo Galilei",
    lang: "en",
    difficulty: "medium",
    solutionRoute: [
        "Renaissance",
        "Aristotle",
        "Galileo Galilei"
    ],
  },
  // English Tech & Philosophy (Hard)
  {
    id: "tech-en-2",
    name: "Web Infrastructure",
    description: "From browsing websites to routing names",
    startArticle: "HTTP",
    endArticle: "Domain Name System",
    lang: "en",
    difficulty: "hard",
    solutionRoute: [
        "HTTP",
        "Domain Name System"
    ],
  },
  {
    id: "science-en-5",
    name: "Physics Paradoxes",
    description: "From classical math to quantum superpositions",
    startArticle: "Mathematics",
    endArticle: "Schrödinger's cat",
    lang: "en",
    difficulty: "hard",
    solutionRoute: [
        "Mathematics",
        "Actuary",
        "Uncertainty",
        "Schrödinger's cat"
    ],
  },
  // --- Tambahan Baru ID Lapis Kedua (Banyak Banget) ---
  // ID Easy
  {
    id: "sports-id-1",
    name: "Legenda Bulu Tangkis",
    description: "Dari legenda modern ke legenda klasik",
    startArticle: "Taufik Hidayat",
    endArticle: "Liem Swie King",
    lang: "id",
    difficulty: "easy",
    solutionRoute: [
        "Taufik Hidayat",
        "Indonesia",
        "Liem Swie King"
    ],
  },
  {
    id: "food-id-4",
    name: "Kuliner Manis",
    description: "Camilan manis tradisional khas Indonesia",
    startArticle: "Martabak",
    endArticle: "Kolak",
    lang: "id",
    difficulty: "easy",
    solutionRoute: [
        "Martabak",
        "Abon",
        "Kolak"
    ],
  },
  {
    id: "tech-id-3",
    name: "Media Sosial Populer",
    description: "Forum legendaris lokal ke media sosial global",
    startArticle: "Kaskus",
    endArticle: "Facebook",
    lang: "id",
    difficulty: "easy",
    solutionRoute: [
        "Kaskus",
        "Amerika Serikat",
        "Facebook"
    ],
  },
  {
    id: "media-id-1",
    name: "Sinema Indonesia",
    description: "Industri layar kaca ke penghargaan film nasional",
    startArticle: "Sinetron",
    endArticle: "Festival Film Indonesia",
    lang: "id",
    difficulty: "easy",
    solutionRoute: [
        "Sinetron",
        "Festival Film Indonesia"
    ],
  },
  // ID Medium
  {
    id: "geography-id-5",
    name: "Puncak dan Danau",
    description: "Dari puncak tertinggi Papua ke danau vulkanik Sumatra",
    startArticle: "Puncak Jaya",
    endArticle: "Danau Toba",
    lang: "id",
    difficulty: "medium",
    solutionRoute: [
        "Puncak Jaya",
        "Danau Toba"
    ],
  },
  {
    id: "geography-id-6",
    name: "Pariwisata Danau",
    description: "Jelajahi keindahan kaldera terbesar",
    startArticle: "Danau Toba",
    endArticle: "Pulau Samosir",
    lang: "id",
    difficulty: "medium",
    solutionRoute: [
        "Danau Toba",
        "Pulau Samosir"
    ],
  },
  {
    id: "history-id-5",
    name: "Kerajaan Islam",
    description: "Perkembangan kesultanan besar di Jawa",
    startArticle: "Kesultanan Mataram",
    endArticle: "Kesultanan Demak",
    lang: "id",
    difficulty: "medium",
    solutionRoute: [
        "Kesultanan Mataram",
        "Kesultanan Demak"
    ],
  },
  {
    id: "culture-id-5",
    name: "Kesenian Bambu",
    description: "Alat musik tradisional ke pusat budayanya",
    startArticle: "Angklung",
    endArticle: "Saung Angklung Udjo",
    lang: "id",
    difficulty: "medium",
    solutionRoute: [
        "Angklung",
        "Udjo Ngalagena",
        "Saung Angklung Udjo"
    ],
  },
  {
    id: "history-id-6",
    name: "Situs Purbakala",
    description: "Situs prasejarah Jawa ke spesies purba manusia",
    startArticle: "Sangiran",
    endArticle: "Homo erectus",
    lang: "id",
    difficulty: "medium",
    solutionRoute: [
        "Sangiran",
        "Homo erectus"
    ],
  },
  // ID Hard
  {
    id: "history-id-7",
    name: "Rempah-Rempah & Kolonial",
    description: "Dari cengkih ke kongsi dagang Belanda",
    startArticle: "Cengkih",
    endArticle: "Vereenigde Oostindische Compagnie",
    lang: "id",
    difficulty: "hard",
    solutionRoute: [
        "Cengkih",
        "Indonesia",
        "Vereenigde Oostindische Compagnie"
    ],
  },
  {
    id: "myth-id-2",
    name: "Wayang & Epik Kuno",
    description: "Karakter pahlawan lokal ke naskah kuno India",
    startArticle: "Gatotkaca",
    endArticle: "Mahabharata",
    lang: "id",
    difficulty: "hard",
    solutionRoute: [
        "Gatotkaca",
        "Mahabharata"
    ],
  },
  {
    id: "law-id-1",
    name: "Konstitusi Negara",
    description: "Undang-Undang Dasar ke penjaga konstitusi",
    startArticle: "Undang-Undang Dasar Negara Republik Indonesia Tahun 1945",
    endArticle: "Mahkamah Konstitusi Republik Indonesia",
    lang: "id",
    difficulty: "hard",
    solutionRoute: [
        "Undang-Undang Dasar Negara Republik Indonesia Tahun 1945",
        "Mahkamah Konstitusi Republik Indonesia"
    ],
  },
  {
    id: "nature-id-3",
    name: "Fauna Purba & Iklim",
    description: "Mamalia besar Sumatra ke masa pembekuan bumi",
    startArticle: "Gajah sumatra",
    endArticle: "Zaman es",
    lang: "id",
    difficulty: "hard",
    solutionRoute: [
        "Gajah sumatra",
        "Aceh",
        "Badak sumatra",
        "Zaman es"
    ],
  },

  // --- Tambahan Baru EN Lapis Kedua (Banyak Banget) ---
  // EN Easy
  {
    id: "game-en-1",
    name: "Gaming Legends",
    description: "From arcade classics to puzzle block games",
    startArticle: "Pac-Man",
    endArticle: "Tetris",
    lang: "en",
    difficulty: "easy",
    solutionRoute: [
        "Pac-Man",
        "Asteroids (video game)",
        "Tetris"
    ],
  },
  {
    id: "music-en-2",
    name: "Pop Stars",
    description: "From modern singer-songwriters to music awards",
    startArticle: "Taylor Swift",
    endArticle: "Grammy Award",
    lang: "en",
    difficulty: "easy",
    solutionRoute: [
        "Taylor Swift",
        "Blues",
        "Grammy Award"
    ],
  },
  {
    id: "tech-en-3",
    name: "Smartphone Wars",
    description: "Battle of mobile ecosystems",
    startArticle: "iPhone",
    endArticle: "Android (operating system)",
    lang: "en",
    difficulty: "easy",
    solutionRoute: [
        "iPhone",
        "Android (operating system)"
    ],
  },
  // EN Medium
  {
    id: "art-en-1",
    name: "Famous Painters",
    description: "From post-impressionism to cubism",
    startArticle: "Vincent van Gogh",
    endArticle: "Pablo Picasso",
    lang: "en",
    difficulty: "medium",
    solutionRoute: [
        "Vincent van Gogh",
        "Andrei Tarkovsky",
        "Pablo Picasso"
    ],
  },
  {
    id: "myth-en-2",
    name: "Greek Mythology",
    description: "From the demigod hero to the home of gods",
    startArticle: "Heracles",
    endArticle: "Mount Olympus",
    lang: "en",
    difficulty: "medium",
    solutionRoute: [
        "Heracles",
        "Apollo",
        "Mount Olympus"
    ],
  },
  {
    id: "history-en-4",
    name: "Industrial Revolution",
    description: "Steam-powered engines to fossil fuels",
    startArticle: "Steam engine",
    endArticle: "Coal",
    lang: "en",
    difficulty: "medium",
    solutionRoute: [
        "Steam engine",
        "Electricity generation",
        "Coal"
    ],
  },
  {
    id: "geography-en-4",
    name: "Great Lakes & Falls",
    description: "Largest freshwater lake to massive waterfalls",
    startArticle: "Lake Superior",
    endArticle: "Niagara Falls",
    lang: "en",
    difficulty: "medium",
    solutionRoute: [
        "Lake Superior",
        "Niagara Falls"
    ],
  },
  // EN Hard
  {
    id: "tech-en-4",
    name: "Cryptography",
    description: "Art of secure communication to modern standards",
    startArticle: "Cryptography",
    endArticle: "Advanced Encryption Standard",
    lang: "en",
    difficulty: "hard",
    solutionRoute: [
        "Cryptography",
        "Advanced Encryption Standard"
    ],
  },
  {
    id: "science-en-6",
    name: "Astrophysics",
    description: "From dense cosmic objects to spacetime curvature",
    startArticle: "Black hole",
    endArticle: "General relativity",
    lang: "en",
    difficulty: "hard",
    solutionRoute: [
        "Black hole",
        "General relativity"
    ],
  },
  {
    id: "finance-en-1",
    name: "Macroeconomics",
    description: "From price inflation to central banking",
    startArticle: "Inflation",
    endArticle: "Federal Reserve",
    lang: "en",
    difficulty: "hard",
    solutionRoute: [
        "Inflation",
        "Adam Smith",
        "Federal Reserve"
    ],
  },
  {
    id: "science-en-7",
    name: "Evolutionary Biology",
    description: "From the father of evolution to species adaptation",
    startArticle: "Charles Darwin",
    endArticle: "Natural selection",
    lang: "en",
    difficulty: "hard",
    solutionRoute: [
        "Charles Darwin",
        "Anthropology",
        "Natural selection"
    ],
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
