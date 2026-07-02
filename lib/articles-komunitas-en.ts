import { BlogArticle } from "./blog-data";

export const artikelKomunitasEn: BlogArticle[] = [
  {
    slug: "fastest-route-this-week",
    title: "Fastest Route This Week: From Article A to Article B",
    summary: "Analysis of the most mind-blowing routes successfully found by community players this week.",
    category: "Community",
    author: "WikiRace Indonesia Team",
    publishedAt: "2026-07-02",
    updatedAt: "2026-07-02",
    readingTime: "4 min",
    language: "en",
    content: `
<p>Welcome to the weekly WikiRace Indonesia Community column! This week, we're looking at some truly mind-boggling completion routes from our players.</p>

<h2>Highlight: From "Coal" to "Anime"</h2>
<p>This challenging route was completed by player <code>@wiki_master99</code> in just 4 clicks!</p>
<p><strong>The original route:</strong> Coal -> Japan (via energy exports) -> Japanese Pop Culture -> Anime.</p>
<p>Incredible lateral thinking. Many other players tried to go through geology, getting stuck in mining articles for hours, while <code>@wiki_master99</code> cleverly saw the global economic connection.</p>

<h2>Next Week's Challenge</h2>
<p>Can you beat the record? Next week's challenge will be posted on the Homepage. Make sure you keep sharpening your navigation instincts!</p>
    `.trim(),
  },
  {
    slug: "monthly-leaderboard-king-of-wikirace",
    title: "Monthly Leaderboard: Who is the King of WikiRace This Month?",
    summary: "Announcement of winners and the most active players in Solo and Multiplayer modes this month.",
    category: "Community",
    author: "WikiRace Indonesia Team",
    publishedAt: "2026-07-02",
    updatedAt: "2026-07-02",
    readingTime: "3 min",
    language: "en",
    content: `
<p>An amazing month for the WikiRace Indonesia community! We have recapped thousands of matches that occurred over the last 30 days, and the competition is fierce.</p>

<h2>Fastest Player (Multiplayer)</h2>
<p>First place goes to <strong>FlashClicker</strong> with an average completion time of only 42 seconds per round! Their reading speed and click accuracy are outstanding.</p>

<h2>Most Efficient Completion (Solo)</h2>
<p>For the Solo category (fewest clicks), <strong>PathfinderID</strong> retains the throne. On average, they only needed 4.1 clicks to complete the daily challenges throughout this month.</p>
<p>Congratulations to the winners! Keep playing the game, improve your ranking, and reach the top spot next month.</p>
    `.trim(),
  },
  {
    slug: "behind-the-scenes-building-wikirace",
    title: "Behind the Scenes: Building WikiRace Indonesia from Scratch",
    summary: "A brief history and development process of the first WikiRace platform dedicated to the Indonesian language.",
    category: "Education",
    author: "WikiRace Indonesia Team",
    publishedAt: "2026-07-02",
    updatedAt: "2026-07-02",
    readingTime: "5 min",
    language: "en",
    content: `
<p>Have you ever wondered how this WikiRace Indonesia platform was made? It all started as a weekend side project that turned into a hub for thousands of players.</p>

<h2>Initial Inspiration</h2>
<p>We realized that although there are several international WikiRace sites, almost none were specifically optimized for the Indonesian Wikipedia. The challenges are different because the number and structure of articles are not exactly the same as the English Wikipedia.</p>

<h2>Technical Architecture</h2>
<p>This site is built using modern technology: <strong>Next.js App Router</strong> for maximum loading speed, combined with <strong>Turso (SQLite)</strong> to store player data and leaderboards very responsively.</p>
<p>Our biggest challenge was processing thousands of Wikipedia articles in real-time without slowing down the server. Therefore, the game utilizes the official Wikipedia API with a <em>client-side fetching</em> technique, meaning the game is very lightweight on our servers yet highly responsive for players.</p>
    `.trim(),
  },
  {
    slug: "new-features-update-wikirace-indonesia",
    title: "New Features Update in WikiRace Indonesia — What Changed?",
    summary: "Latest patch notes: new modes, bug fixes, and UI performance optimizations.",
    category: "Community",
    author: "WikiRace Indonesia Team",
    publishedAt: "2026-07-02",
    updatedAt: "2026-07-02",
    readingTime: "4 min",
    language: "en",
    content: `
<p>We continuously listen to community feedback. In this v1.2 update, we bring a number of quality of life (QoL) improvements and highly anticipated new features.</p>

<h2>1. "Mobile Wikipedia" UI Mode</h2>
<p>Now, if you play on a mobile device, the article display inside the racing arena will automatically adjust to the <em>Mobile Wikipedia</em> style. Images will be centered, no more tables breaking the layout, and fonts are much more comfortable to read!</p>

<h2>2. Click Animation & Feedback</h2>
<p>Many were confused about whether their click registered during a slow connection. We have added a light <em>loading</em> indicator when you click a link, so you know the page is loading.</p>

<h2>3. Leaderboard Optimization</h2>
<p>The leaderboard now loads 3x faster thanks to a new caching implementation in our database.</p>
    `.trim(),
  },
  {
    slug: "most-epic-match-highlight",
    title: "Highlight of the Most Epic Match from the Community This Week",
    summary: "Review of the most dramatic multiplayer matches and unexpected comebacks.",
    category: "Community",
    author: "WikiRace Indonesia Team",
    publishedAt: "2026-07-02",
    updatedAt: "2026-07-02",
    readingTime: "4 min",
    language: "en",
    content: `
<p>In a private room match last weekend, one of the most dramatic races ever recorded on our server took place.</p>

<h2>The Underdog's Comeback Story</h2>
<p>In the final match of the community tournament, the route was: <strong>Rendang -> Black Hole</strong>.</p>
<p>Player A took a quick lead jumping from Rendang -> West Sumatra -> Astronomy. However, they got stuck in the overly broad Astronomy article and mistakenly clicked an article about the History of the Telescope.</p>
<p>Meanwhile, Player B, who was far behind and had wandered into the "Padang Cuisine" article, suddenly spotted an epic shortcut: Padang Cuisine -> List of Cultures -> Modern Physics -> Black Hole. Player B overtook at the last second and won with a time difference of only 1.2 seconds!</p>
<p>This kind of excitement is what makes WikiRace never get old.</p>
    `.trim(),
  }
];
