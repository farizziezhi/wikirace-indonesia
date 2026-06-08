# Solo Mode Design — Time Attack & Free Roam

Status: Draft

## Summary

Add Solo Mode accessible from home page. Two modes: Time Attack (timer) and Free Roam (no timer, count clicks). Articles generated server-side and guaranteed reachable within N clicks using BFS.

## Goals

- Provide single-player practice mode.
- Guarantee start → end reachable within N clicks.
- No persistent score storage (user requested no persistence).
- Minimal infra change. Use existing Wikipedia helpers.

## Routes

- GET /solo — UI picker (app/solo/page.tsx)
- GET /solo/play — Game UI (app/solo/play/page.tsx)
- GET /api/solo/generate — returns { startArticle, endArticle, estimatedDepth }

## Libraries

- lib/solo-bfs.ts — BFS generator using Wikipedia API

## BFS Algorithm

- Random start article fetched by `fetchRandomArticle(lang)`
- BFS via `query?action=query&prop=links` up to `maxDepth` (default 4)
- Collect candidate nodes at depth 2..maxDepth
- Limit explored nodes to 200 per attempt
- Retry up to 3 attempts

## UI Behavior

- Start from home page button "Latihan Solo"
- Mode picker: Time Attack / Free Roam
- On Start: call `/api/solo/generate` and navigate to `/solo/play` with start/end in query
- Time Attack: timer starts on load, stops when end article reached
- Free Roam: no timer, count clicks
- Show finish modal with clicks, time (if any), route list

## Security / Rate Limiting

- Middleware rate limiter added in `middleware.ts`
- Prefer Upstash Ratelimit if env vars present; otherwise fallback to in-memory limiter for local dev
- Rate limit scope: all `/api/*` requests

## Testing

- Manual test flows:
  - Start solo session, ensure start/end generated
  - Navigate links, ensure navigation intercept works and route recorded
  - Finish session, validate finish modal
  - Trigger rate-limit by firing many `/api/solo/generate` calls

## Implementation Notes

- `@upstash/ratelimit` added as dependency
- No backend persistence for runs per user request

## Next Steps

- Spec self-review
- Commit and push changes
- Ask user to review spec file
