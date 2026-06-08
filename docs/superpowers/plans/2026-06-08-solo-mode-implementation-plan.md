# Solo Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Solo Mode (Time Attack + Free Roam) with server-side procedural article generation and API rate limiting.

**Architecture:** Server-side solo generator (`/api/solo/generate`) performs BFS over Wikipedia links to produce reachable end article. Client provides `/solo` picker and `/solo/play` UI. Middleware rate limiter guards `/api/*` using Upstash Ratelimit when env available, otherwise in-memory fallback.

**Tech Stack:** Next.js app router, Node fetch, Upstash Redis + @upstash/ratelimit, existing Wikipedia helpers.

---

### Files map

- Create: `lib/solo-bfs.ts` — BFS generator (exists)
- Create: `app/api/solo/generate/route.ts` — API route (exists)
- Create: `app/solo/page.tsx` — Solo picker UI (exists)
- Create: `app/solo/play/page.tsx` — Solo play UI (exists)
- Modify: `app/page.tsx:108-146` — add handleSolo and solo button (done)
- Modify: `middleware.ts` — add rate limiting logic (done)
- Modify: `package.json` — add `@upstash/ratelimit` dependency (done)

### Tests

No unit test framework currently present. Manual test steps included.

---

### Task 1: Commit current changes (snapshot)
- [ ] **Step 1:** Stage implemented files
  - Run:
    ```bash
    git add app/page.tsx lib/solo-bfs.ts app/solo app/api/solo middleware.ts package.json pnpm-lock.yaml docs/superpowers/specs/2026-06-08-solo-mode-design.md docs/superpowers/plans/2026-06-08-solo-mode-implementation-plan.md
    ```
- [ ] **Step 2:** Commit
  - Run:
    ```bash
    git commit -m "feat: add solo mode UI, generator, and API rate limiting" \
      
  Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
    ```

---

### Task 2: Verify API generator locally
- [ ] **Step 1:** Start dev server
  - Run: `pnpm dev`
  - Expected: Next dev starts, port 3000
- [ ] **Step 2:** Hit generator endpoint
  - Run:
    ```bash
    curl "http://localhost:3000/api/solo/generate?lang=id&mode=time-attack"
    ```
  - Expected: JSON `{ startArticle, endArticle, estimatedDepth }` or error HTTP 500 on failure
- [ ] **Step 3:** If response 500, inspect server logs and retry. If Upstash errors occur, ensure env vars absent or valid.

---

### Task 3: Manual playtest flow
- [ ] **Step 1:** Open http://localhost:3000 in browser
- [ ] **Step 2:** Click "Latihan Solo" from Home
- [ ] **Step 3:** Select Time Attack, Start
- [ ] **Step 4:** Confirm navigation to `/solo/play` and that UI shows start article
- [ ] **Step 5:** Click links until reach end article; confirm timer and clicks tracked; finish modal appears with route
- [ ] **Step 6:** Repeat for Free Roam mode and confirm clicks count increments and finish modal shows

---

### Task 4: Rate-limiter validation
- [ ] **Step 1:** Simulate burst requests to `/api/solo/generate` from same IP
  - Run:
    ```bash
    for i in {1..40}; do curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000/api/solo/generate?lang=id" & done
    ```
  - Expected: Some 429 responses when limit exceeded
- [ ] **Step 2:** If Upstash is used in prod, create a load test or use K6 to validate

---

### Task 5: Add minimal tests (optional quick smoke)
- [ ] **Step 1:** Add simple smoke script `scripts/smoke-solo.js` that fetches `/api/solo/generate` and asserts JSON
  - Create `scripts/smoke-solo.js` with node fetch code
- [ ] **Step 2:** Run smoke script
  - Run: `node scripts/smoke-solo.js`
  - Expected: logs start/end/ok

---

### Task 6: Documentation commit
- [ ] **Step 1:** Commit spec and plan
  - Run:
    ```bash
    git add docs/superpowers/specs/2026-06-08-solo-mode-design.md docs/superpowers/plans/2026-06-08-solo-mode-implementation-plan.md
    git commit -m "docs: solo mode design + implementation plan"
    
  Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
    ```

---

### Self-review checklist
1. Spec coverage: BFS + UI + API + rate limiting present in tasks.
2. Placeholder scan: No TODO placeholders in tasks. All code created in repo.
3. Type consistency: Functions and routes use `startArticle`/`endArticle` naming consistently.

---

Plan saved to `docs/superpowers/plans/2026-06-08-solo-mode-implementation-plan.md`.

Execution options:
1. Subagent-Driven (recommended)
2. Inline Execution (perform remaining steps now)

Which approach?