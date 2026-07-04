/**
 * Daftar username bot yang realistis — campuran nickname gaming, username random,
 * dan beberapa yang pakai nama asli (seperti user pada umumnya).
 */
const BOT_NAMES = [
  // Gaming-style usernames (Indonesia)
  "xNaufal",
  "rzkyyy_",
  "bangDito",
  "putri.exe",
  "anggaaa12",
  "kociw_",
  "wahyuGG",
  "dimasXD",
  "zhar_05",
  "itsRani",
  "nblxyz",
  "farellcuy",
  "tya_",
  "bapakmu69",
  "rafly.id",
  "reyyy_",
  "wikiwarrior",
  "gabuttz",
  "cptFahri",
  "aldrich_27",
  "ayuuu_w",
  "kenshin.jr",
  "bintangg",
  "aselole99",
  "jagoanWiki",
  "rrrizal",
  "nyak.cut",
  "kopitaro",
  "gamerKampung",
  "speedIbnuX",

  // Gaming-style usernames (English / International)
  "xNova_",
  "notabot_lol",
  "wikiRacer42",
  "itsLily",
  "tryhard_tom",
  "clickfast23",
  "mr_wiki",
  "zoeyyyy",
  "dannyx_",
  "luvlinks",
  "bruh_moment",
  "swiftNav",
  "queenB_",
  "noobmaster99",
  "jake.exe",
  "randomGuy7",
  "vibecheck_",
  "ellaXO",
  "turboLink",
  "axel.gg",

  // Nickname pendek/aesthetic
  "syl",
  "mno_",
  "fyx",
  "vnz",
  "kio",
  "arz_",
  "yui",
  "rxa",

  // Beberapa yang pakai nama asli (realistis — ada user begini juga)
  "andiwijaya",
  "sarahclark",
  "kevinprtm",
  "jessica_t",
  "farizz",
  "lucas.m",
];

// Database Chat Bot Realistis
export const BOT_GREETINGS_ID = [
  "halo all",
  "salken yaaa",
  "GLHF guys!",
  "misi maseee",
  "gas race guys!",
  "halo halo",
  "dah rame aja nih",
  "semangat semuaa",
  "yooo, salken",
  "siap race!",
];

export const BOT_GREETINGS_EN = [
  "hello everyone",
  "glhf!",
  "yo!",
  "hi guys",
  "ready to race?",
  "good luck everyone",
  "let's do this!",
  "hey",
  "glhf everyone",
];

export const BOT_LOBBY_CHAT_ID = [
  "gas lahh",
  "siap nih",
  "ayoo start",
  "udah ready nih gw",
  "semoga dapet artikel gampang wkwk",
  "lama jg ya nunggu orang",
  "gas gas gas",
  "gass",
];

export const BOT_LOBBY_CHAT_EN = [
  "let's go",
  "ready up!",
  "can we start?",
  "hope the article is easy lol",
  "i'm ready",
  "let's start!",
  "ready when you are",
];

export const BOT_IN_GAME_START_ID = [
  "glhf!",
  "gas!",
  "go go go!",
  "semangatt",
  "let's go!",
];

export const BOT_IN_GAME_START_EN = [
  "glhf!",
  "let's go!",
  "go go go!",
  "good luck",
  "gogogo",
];

export const BOT_IN_GAME_END_ID = [
  "ggwp",
  "seru jg wkwk",
  "nice game!",
  "capek bener nyari linknya wkwk",
  "mayan susah ya",
  "ggwp!",
  "akhirnya nyampe jg",
];

export const BOT_IN_GAME_END_EN = [
  "ggwp",
  "gg",
  "good game!",
  "that was fun lol",
  "tough route",
  "ggwp!",
  "made it!",
];

export const BOT_EMOJIS = ["🔥", "👍", "👏", "😂", "🎉", "😤", "😮", "🤔"];

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
    return `user_${Math.floor(100 + Math.random() * 900)}`;
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
}

/**
 * Periksa apakah sebuah username ada di daftar nama bot.
 * Dipakai oleh profile API untuk menampilkan profil default bagi bot.
 */
export function isBotName(username: string): boolean {
  return BOT_NAMES.some((name) => name.toLowerCase() === username.toLowerCase());
}

/**
 * Membuat jadwal reaksi emoji dan chat in-game untuk bot secara realistis.
 */
export function generateBotReactions(botFinishTime: number, language: "id" | "en") {
  const isEn = language === "en";
  const botEmojis: Array<{ emoji: string; timestamp: number }> = [];
  const botChats: Array<{ text: string; timestamp: number }> = [];

  // 1. Emoji Reactions
  // Mid game emojis (1/4, 2/4, 3/4)
  const steps = [0.25, 0.5, 0.75];
  steps.forEach((step) => {
    if (Math.random() < 0.6) {
      const emoji = BOT_EMOJIS[Math.floor(Math.random() * BOT_EMOJIS.length)];
      const ts = Math.floor(botFinishTime * step);
      if (ts > 0 && ts < botFinishTime) {
        botEmojis.push({ emoji, timestamp: ts });
      }
    }
  });

  // Finish emoji (sangat tinggi kemungkinan)
  if (Math.random() < 0.85) {
    const endEmojis = ["😂", "🎉", "👏", "🔥", "😤"];
    const emoji = endEmojis[Math.floor(Math.random() * endEmojis.length)];
    botEmojis.push({ emoji, timestamp: Math.max(1, botFinishTime - 1) });
  }

  // 2. Chat messages
  // Start game chat (80% chance)
  if (Math.random() < 0.8) {
    const pool = isEn ? BOT_IN_GAME_START_EN : BOT_IN_GAME_START_ID;
    const text = pool[Math.floor(Math.random() * pool.length)];
    botChats.push({ text, timestamp: 1 + Math.floor(Math.random() * 3) }); // 1 - 3 detik
  }

  // Mid game chat comment (hanya jika game cukup lama, e.g. >= 20 detik)
  if (botFinishTime >= 20 && Math.random() < 0.35) {
    const midCommentsId = ["agak bingung gw", "mana ya linknya", "jauh bener muternya", "nyasar nih kyknya", "ada yang tau arahnya?", "wiki-nya susah jg"];
    const midCommentsEn = ["lost a bit", "where is the link", "so many clicks lol", "hard one", "anyone knows the way?", "this is challenging"];
    const pool = isEn ? midCommentsEn : midCommentsId;
    const text = pool[Math.floor(Math.random() * pool.length)];
    botChats.push({ text, timestamp: Math.floor(botFinishTime * 0.5) });
  }

  // End game chat (90% chance)
  if (Math.random() < 0.9) {
    const pool = isEn ? BOT_IN_GAME_END_EN : BOT_IN_GAME_END_ID;
    const text = pool[Math.floor(Math.random() * pool.length)];
    botChats.push({ text, timestamp: botFinishTime + 1 + Math.floor(Math.random() * 2) }); // 1 - 2 detik setelah finish
  }

  return { botEmojis, botChats };
}

