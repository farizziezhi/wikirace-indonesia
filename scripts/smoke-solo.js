const BASE = process.env.BASE_URL || "http://localhost:3000";

async function run() {
  const res = await fetch(`${BASE}/api/solo/generate?lang=id`);
  const json = await res.json();
  if (!json.startArticle || !json.endArticle) {
    console.error("Smoke FAILED", json);
    process.exit(2);
  }
  console.log(`Smoke OK: ${json.startArticle} → ${json.endArticle} (depth ${json.estimatedDepth})`);
}

run().catch((e) => { console.error(e); process.exit(1); });
