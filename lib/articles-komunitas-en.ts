import { BlogArticle } from "./blog-data";

export const artikelKomunitasEn: BlogArticle[] = [
  {
    slug: "fastest-route-this-week",
    title: "Fastest Route This Week: From Article A to Article B",
    summary: "Analysis of the most mind-blowing routes successfully found by community players this week.",
    category: "Community",
    author: "Ahmad Zaki",
    publishedAt: "2026-06-09",
    updatedAt: "2026-06-09",
    readingTime: "4 min",
    language: "en",
    content: `
<p>Welcome to the weekly WikiRace Indonesia Community column! Every week, thousands of matches are played on our servers. Some players wander aimlessly in circles, while others find "expressways" that ordinary players would never even think of.</p>
<p>This week, our curation team analyzed the server logs and found some truly mind-boggling completion routes. Let's dissect how the minds of these winners work!</p>

<h2>Main Highlight: From "Coal" to "Anime"</h2>
<p>These seemingly completely unrelated topics became the daily challenge last Wednesday. The average player completed this route in 15 to 20 clicks. However, this route was successfully conquered by a player with the username <code>@wiki_master99</code> in just <strong>4 clicks</strong>!</p>
<p>Many novice players tried to go through the geology or mining route, only to get stuck in articles about fossils or heavy industry for hours. But <code>@wiki_master99</code> cleverly saw a loophole through global economic connections.</p>

<h3>Dissecting @wiki_master99's Route:</h3>
<ol>
  <li><strong>Click 1: Export</strong> - From the Coal article, they looked for the industry and trade section, then clicked the Export link.</li>
  <li><strong>Click 2: Japan</strong> - On the Export page, they searched for the list of the world's largest commodity importer countries and clicked Japan.</li>
  <li><strong>Click 3: Japanese Pop Culture</strong> - On Japan's main page, they immediately scrolled to the "Culture" section and clicked Japanese Pop Culture.</li>
  <li><strong>Click 4: Anime</strong> - From the Pop Culture page, the Anime link was instantly visible in the first paragraph!</li>
</ol>
<p>This incredible lateral thinking proves that knowledge of geography and macroeconomics can be extremely useful in playing WikiRace.</p>

<h2>Another Unique Route: "Borobudur Temple" to "Theory of Relativity" (6 Clicks)</h2>
<p>Completed by player <code>@Racer_X</code>, this route utilized the "Historical Figure" bridge.</p>
<ul>
  <li>Borobudur Temple &rarr; UNESCO &rarr; United Nations (UN) &rarr; Albert Einstein (as a figure who corresponded with international bodies) &rarr; Theory of Relativity.</li>
</ul>

<h2>Next Week's Challenge</h2>
<p>Do you have navigation instincts as sharp as theirs? Or will you get lost in Wikipedia's lengthy articles? Next week's challenge will be posted exactly at midnight on the <a href="/">WikiRace Indonesia</a> Homepage.</p>
<p>Make sure you keep sharpening your navigation instincts, study the structure of Wikipedia articles, and get ready to set new records. If you manage to find an even crazier route, share your screenshot on our community Discord!</p>
    `.trim(),
  },
  {
    slug: "monthly-leaderboard-king-of-wikirace",
    title: "Monthly Leaderboard: Who is the King of WikiRace This Month?",
    summary: "Announcement of winners and the most active players in Solo and Multiplayer modes this month.",
    category: "Community",
    author: "Indra Wijaya",
    publishedAt: "2026-06-20",
    updatedAt: "2026-06-20",
    readingTime: "3 min",
    language: "en",
    content: `
<p>An amazing month for the WikiRace Indonesia community! We have recapped hundreds of thousands of clicks from thousands of live matches that occurred over the last 30 days. The competition this month proved to be very fierce, with several long-standing records finally broken.</p>
<p>Without further ado, let's announce who the rulers of the Wikipedia arena are this month for each prestigious category!</p>

<h2>Fastest Player Category (Multiplayer Mode)</h2>
<p>In real-time multiplayer mode, skimming speed and click accuracy are key. Being fast isn't enough if you click the wrong link and end up lost.</p>
<p>The top spot this month goes to <strong>FlashClicker</strong>! Their performance statistics are truly chilling:</p>
<ul>
  <li><strong>Average completion time:</strong> 42 seconds per round!</li>
  <li><strong>Win Rate:</strong> 78% out of a total of 150 matches played.</li>
  <li><strong>Secret Weapon:</strong> Extraordinary mastery of hub articles themed around Geography and European History.</li>
</ul>

<h2>Most Efficient Completion Category (Fewest Clicks)</h2>
<p>Unlike multiplayer mode which prioritizes speed, this category is purely about efficiency and word association intelligence. Players in this category think like search engines, mapping the shortest distance between two concept points.</p>
<p>For this efficiency category, the defending champion <strong>PathfinderID</strong> retains their throne. Their achievements this month:</p>
<ul>
  <li><strong>Average click count:</strong> 4.1 clicks per completion.</li>
  <li><strong>Best Route of the Month:</strong> Completing the "Banana" to "French Revolution" route in just 3 clicks (Banana &rarr; International Trade &rarr; France &rarr; French Revolution).</li>
</ul>

<h2>Most Dedicated Player Category (Most Matches)</h2>
<p>We also want to give special appreciation to the player with the most matches this month. This title goes to <strong>WikiAddict_07</strong>, who completed <strong>840 rounds</strong> in 30 days!</p>

<h2>Get Ready For the Next Season!</h2>
<p>Congratulations to this month's winners! For those of you who haven't made it to the Leaderboard, don't be discouraged. Scores will be reset on the 1st of every month. Keep playing the game at <a href="/">WikiRace Indonesia</a>, study Wikipedia's article structure, improve your ranking, and reach the top spot next month!</p>
    `.trim(),
  },
  {
    slug: "behind-the-scenes-building-wikirace",
    title: "Behind the Scenes: Building WikiRace Indonesia from Scratch",
    summary: "A brief history and development process of the first WikiRace platform dedicated to the Indonesian language.",
    category: "Education",
    author: "Indra Wijaya",
    publishedAt: "2026-07-03",
    updatedAt: "2026-07-03",
    readingTime: "5 min",
    language: "en",
    content: `
<p>Have you ever been engrossed in a game and suddenly wondered: <em>"Who actually made this website? And how does it fetch Wikipedia articles directly?"</em></p>
<p>In this Education and Community article, we will invite you to peek into the development kitchen of WikiRace Indonesia. It all started as a weekend "side project" that has now turned into a brain-brawling arena for thousands of players.</p>

<h2>Initial Inspiration: Why Make an Indonesian Version?</h2>
<p>The idea emerged about a year ago. Our development team, who are IT students and trivia enthusiasts, often played the international version of <em>The Wiki Game</em>. However, we realized one important thing: playing on the English Wikipedia felt less relatable for some people.</p>
<p>There was almost no WikiRace platform specifically optimized and fully dedicated to the Indonesian Wikipedia (WBI). Yet, the challenges are vastly different! The structure of articles, the depth of topics, and the number of articles in WBI (around 600,000 articles) create a highly unique game dynamic (meta-game) compared to the English version.</p>

<h2>Technical Architecture: Building a Fast Racing Engine</h2>
<p>Building a real-time game platform that relies on a third-party service (Wikipedia) is not an easy task. If we designed the system incorrectly, our servers could go down in minutes due to overload, or our site could be blocked by Wikipedia.</p>
<p>Here is the secret tech stack behind your smooth gaming experience:</p>
<ul>
  <li><strong>Modern Framework (Next.js App Router):</strong> We use Next.js so the website can load pages incredibly fast (Server-Side Rendering), making the loading time between Wikipedia articles feel instant.</li>
  <li><strong>Fast Database (Turso / SQLite):</strong> To store the data of thousands of players, score history, and real-time leaderboards, we needed a super-responsive database without suffocating hosting costs.</li>
  <li><strong>Client-Side Fetching & Wikipedia API:</strong> This is the main secret! Instead of our server downloading Wikipedia articles (which would blow up our server if there were 1000 concurrent players), the game instructs the browser on your phone or laptop (the client) to directly fetch data from the official Wikipedia API asynchronously (AJAX).</li>
</ul>

<h2>Dealing with Cheater Challenges</h2>
<p>Like any competitive game, there are always players who try to cheat (e.g., using script bots or the "Ctrl+F" function). We continuously develop step validation systems in the backend to detect click intervals that are unreasonable for a normal human, ensuring the leaderboard remains clean and fair.</p>
<p>Thank you to all the players who have supported this experimental project from the beginning. Keep playing, and help us grow the <a href="/">WikiRace Indonesia</a> community even bigger!</p>
    `.trim(),
  },
  {
    slug: "new-features-update-wikirace-indonesia",
    title: "New Features Update in WikiRace Indonesia — What Changed?",
    summary: "Latest patch notes: new modes, bug fixes, and UI performance optimizations.",
    category: "Community",
    author: "Novi Arisanti",
    publishedAt: "2026-07-04",
    updatedAt: "2026-07-04",
    readingTime: "4 min",
    language: "en",
    content: `
<p>Hello Wikipedia racers! We at the <a href="/">WikiRace Indonesia</a> development team are always listening to your complaints, bug reports, and brilliant feedback from the community, whether through Discord, contact forms, or social media comments.</p>
<p>Today, we are thrilled to announce the release of <strong>Update Version 1.2</strong>! This update is focused on massive Quality of Life (QoL) improvements, user experience (UX) enhancements, and a few performance tweaks under the hood. Let's break down what's new!</p>

<h2>1. "Mobile Wikipedia" UI Mode (Highly Requested!)</h2>
<p>This was the number one complaint from players on smartphones: Wikipedia's information tables (infoboxes) often broke the layout, requiring users to scroll left and right, which severely hindered gameplay speed.</p>
<p><strong>v1.2 Solution:</strong> Now, our rendering engine automatically detects the user's screen size. If you're playing on a phone, the articles inside the racing arena will automatically be parsed into the <strong>Mobile Wikipedia</strong> style! Images will be neatly centered, complex tables will be hidden or resized, and fonts are optimized for thumb tapping. Racing on your phone is now just as fast as on a PC!</p>

<h2>2. Clearer Click Animation & Feedback</h2>
<p>Many players with occasionally unstable internet connections complained: <em>"I clicked the link but nothing happened, so I clicked it multiple times."</em></p>
<p><strong>v1.2 Solution:</strong> We have added a subtle loading bar indicator at the top of the screen (like on YouTube) and a "fade-out" transition effect on the text right after you click a blue link. Now you will instantly know that your tap has been registered and the system is fetching the next article from the Wikipedia server.</p>

<h2>3. Leaderboard & Database Optimization</h2>
<p>As our community grew larger, the Leaderboard page started feeling sluggish when loading because it had to calculate tens of thousands of score rows on the fly.</p>
<p><strong>v1.2 Solution:</strong> We have implemented a new caching system using Redis on the backend. The result? The Leaderboard page now loads <strong>3x faster</strong>! You can immediately show off your position to your friends without waiting.</p>

<h2>4. Minor Bug Fixes (Patch Notes)</h2>
<ul>
  <li>Fixed a bug where citation links (small numbers in brackets, e.g., <code>[1]</code>, <code>[2]</code>) were sometimes clickable and disrupted the flow of the game. Now all citations and footnotes have been disabled in the racing arena.</li>
  <li>Fixed the dark mode which sometimes didn't apply perfectly to certain tables on Wikipedia.</li>
</ul>
<p>We hope this update makes your gaming experience even more exciting! Keep sending us your feedback. See you in the arena!</p>
    `.trim(),
  },
  {
    slug: "most-epic-match-highlight",
    title: "Highlight of the Most Epic Match from the Community This Week",
    summary: "Review of the most dramatic multiplayer matches and unexpected comebacks.",
    category: "Community",
    author: "Budi Hartono",
    publishedAt: "2026-06-11",
    updatedAt: "2026-06-11",
    readingTime: "4 min",
    language: "en",
    content: `
<p>Multiplayer mode in WikiRace always delivers unpredictable and tense stories. Unlike playing Solo where your biggest enemies are yourself and the hourglass, in Multiplayer mode, the psychological pressure of seeing your opponent's indicator getting closer to the goal can make a player panic and make fatal mistakes.</p>
<p>In a private room community mini-tournament last weekend, one of the most dramatic matches ever recorded in our system took place. Let's break down how this epic match unfolded!</p>

<h2>The Final Match Setup</h2>
<p>This match was the deciding final round that brought together two veteran players in our community Discord: <strong>Player A</strong> (a speed route specialist) vs <strong>Player B</strong> (an out-of-the-box route specialist). The computer system randomly assigned a fairly brutal route task:</p>
<p><strong>Starting Point:</strong> Rendang (Traditional Food)<br>
<strong>End Goal:</strong> Black Hole (Astrophysics)</p>

<h2>The Underdog's Comeback Story</h2>
<p><strong>Minute 00:00 - 00:30: Player A's Dominance</strong><br>
As soon as the match started, Player A took a very convincing lead. They used a basic geography bridge strategy: from <code>Rendang</code>, they immediately clicked the <code>West Sumatra</code> link, then to <code>Indonesia</code>, planning to head to <code>Science</code> or <code>Astronomy</code> via the education section.</p>

<p><strong>Minute 00:30 - 01:15: The "Rabbit Hole" Trap</strong><br>
Player A successfully reached the <code>Astronomy</code> page. However, in their haste, they mistakenly clicked an article about the <code>History of the Telescope</code>. This is where disaster struck. The article was full of technical medieval optics terminology, and they got stuck wandering through ancient astronomer articles without finding a way back to a modern cosmic concept like a Black Hole.</p>

<p><strong>Minute 01:15 - End: Player B's Epiphany</strong><br>
Meanwhile, Player B was lagging quite far behind. Early in the game, they had wandered into the <code>Padang Cuisine</code> and <code>List of Indonesian Cultures</code> articles. But while on the culture page, they found a link for <code>Indonesian Scientists</code>, which miraculously led them to the <code>Modern Physics</code> article.</p>
<p>Once the Modern Physics page opened, the link for <code>Albert Einstein</code> (the father of the theory of relativity which underlies the existence of black holes) was clearly visible in the second paragraph. From Einstein's page, the link for <code>Black Hole</code> was just two scrolls down.</p>
<p>Player B overtook Player A at the very last second and hit the finish button with a time difference of <strong>only 1.2 seconds!</strong></p>

<h2>Lessons Learned</h2>
<p>This match proves the golden rule in <a href="/">WikiRace Indonesia</a>: <strong>Speed isn't everything if you lose your cool.</strong> One wrong click out of panic can send you down an endless Wikipedia "rabbit hole", while staying calm can help you spot even the most illogical shortcuts.</p>
<p>Do you have an epic moment playing against your friends? Don't hesitate to share it on our Discord server!</p>
    `.trim(),
  }
];
