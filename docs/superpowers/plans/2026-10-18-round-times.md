# Round Times Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Record when each round ends and show per-round times as a second, swipeable chart next to the points graph, replacing the Time tile at the top of the game page.

**Architecture:** The backend pushes a timestamp onto `game.roundEndedAt` whenever `nextRound` completes a round and returns it in `getGameResponse`. A pure frontend module turns `createdAt` + `roundEndedAt` into durations and stats. A new `RoundTimesChart` draws them, and a `GameCharts` scroll-snap panel puts it next to `PlayerPointsChart`.

**Tech Stack:**
- Backend: Express 5, Mongoose, Vitest + Supertest.
- Frontend: React 19, TypeScript, Tailwind v4, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-18-round-times-design.md`

## Global Constraints

- Run npm commands from `backend/` or `frontend/`.
- TDD: write each test first and see it fail for the expected reason. Bug-style tests get an issue comment, e.g. `// Issue #48: ...`.
- No new npm dependencies; the swipe is native CSS scroll-snap.
- Format durations with `formatDuration` from `@/core/duration` (m:ss, or h:mm:ss from an hour on).
- Use `import type` for type-only imports. No `console.*`, `alert()` or `confirm()`.
- Copy that is fixed, verbatim:
  - the chart title "Round Times";
  - the stat labels "Total", "Avg", "Longest", "Shortest";
  - the empty state "Round times weren't recorded for this game.";
  - the dot labels "Points history" / "Round times";
  - the points tooltip line `Round 3 · 4:10`.
- Done when, in `frontend/`, `npm test`, `npm run lint` and `npm run typecheck` pass, and `npm test` passes in `backend/`.

## Review Focus

1. **Client clock behind the server:** the live round would be negative. `liveMs` must be clamped to ≥ 0 (test in Task 2).
2. **All bars zero, or the live round at 0 ms:** the y-scale divides by zero. The chart must render no `NaN` attributes (test in Task 3).
3. **A game that ends in round 1:** one finished round, no live bar, no average line, stats from that one round (tests in Tasks 2 and 3).
4. **Many rounds (e.g. 40):** every bar is drawn, and there are at most 6 x labels on desktop and 4 on mobile, like the points chart (test in Task 3).
5. **Only the live round exists (round 1 in progress):** stats are `null`; Total shows the live time and the other stats show "–" (test in Task 3).

---

### Task 1: Record round end times (backend)

**Files:**
- Modify: `backend/models/Game.js` (game schema, next to `finishedAt`)
- Modify: `backend/service/GamesService.js` (`nextRound` ~L261, `getGameResponse` ~L400)
- Test: `backend/tests/games.test.mjs`

**Interfaces:**
- Produces: game responses carry `roundEndedAt: string[]` (ISO dates, always an array). Entry *i* is when round *i+1* ended.

- [ ] **Step 1: Write the failing tests**

Add a new `describe('round times', ...)` block with the file's existing `playRound` and `game()` helpers:

```js
// Issue #48: per-round times need to know when each round ended
it('records when each round ends', async () => {
    expect((await game()).roundEndedAt).toEqual([]);
    const before = Date.now();

    await playRound([[alice, 10], [bob, 20]]);
    await playRound([[alice, 10], [bob, 20]]);

    const { createdAt, roundEndedAt } = await game();
    expect(roundEndedAt).toHaveLength(2);
    const times = roundEndedAt.map(t => new Date(t).getTime());
    expect(times[0]).toBeGreaterThanOrEqual(Math.max(before, new Date(createdAt).getTime()));
    expect(times[1]).toBeGreaterThanOrEqual(times[0]);
});

it('records the final round at the moment the game ends', async () => {
    await alice.post(`/api/games/${gameId}/submitWinCondition`, { winCondition: 100 }).expect(200);

    await playRound([[alice, 100], [bob, 50]]);

    const { roundEndedAt, finishedAt } = await game();
    expect(roundEndedAt).toEqual([finishedAt]);
});

it('does not record a round end when the round is reset', async () => {
    await alice.post(`/api/games/${gameId}/submitScore`, { score: 10 }).expect(200);
    await bob.post(`/api/games/${gameId}/resetRound`).expect(200);

    expect((await game()).roundEndedAt).toEqual([]);
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run tests/games.test.mjs -t "round"`
Expected: the new tests FAIL (`roundEndedAt` is `undefined`).

- [ ] **Step 3: Implement**

- **Schema:** add `roundEndedAt: { type: [Date], default: [] }`.
- **`nextRound`:** after the all-submitted check, take `const endedAt = new Date()` and push it onto `game.roundEndedAt` (guard a missing array on old documents, as the code already does for `pointsHistory`). In the winner branch, set `game.finishedAt = endedAt` so both values are equal.
- **`getGameResponse`:** add `roundEndedAt: game.roundEndedAt || []`.

- [ ] **Step 4: Run the backend suite**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add backend/models/Game.js backend/service/GamesService.js backend/tests/games.test.mjs
git commit -m "Record when each round ends"
```

---

### Task 2: Round duration logic (frontend)

**Files:**
- Modify: `frontend/src/types/game.types.ts` (`Game`)
- Create: `frontend/src/core/roundTimes.ts`
- Test: `frontend/src/core/roundTimes.test.ts`

**Interfaces:**
- Consumes: `Game.roundEndedAt` from Task 1.
- Produces:

```ts
// on Game
roundEndedAt?: string[];

export interface RoundDurations { rounds: number[]; liveMs: number | null }
export interface RoundTimeStats {
    totalMs: number;
    averageMs: number;
    longest: { round: number; ms: number };   // round is 1-based
    shortest: { round: number; ms: number };
}
export function roundDurations(
    game: Pick<Game, 'createdAt' | 'currentRound' | 'isFinished' | 'roundEndedAt'>,
    now: number,
): RoundDurations | null;
export function roundTimeStats(rounds: number[]): RoundTimeStats | null;
```

- [ ] **Step 1: Write the failing tests**

Use `const t = (min: number) => new Date(Date.UTC(2026, 0, 1, 12, min)).toISOString()` and `const MIN = 60_000`. Name each case and assert:

- `"times each finished round from the end of the previous one"`:
  - Input: `createdAt: t(0)`, `roundEndedAt: [t(4), t(6), t(17)]`, `currentRound: 4`, not finished, `now = Date.parse(t(20))`.
  - Expect `{ rounds: [4*MIN, 2*MIN, 11*MIN], liveMs: 3*MIN }`.
- `"has no live round once the game is finished"`:
  - Input: `roundEndedAt: [t(4), t(6)]`, `currentRound: 2`, `isFinished: true`.
  - Expect `liveMs: null`, `rounds: [4*MIN, 2*MIN]`.
- `"times a game that ended in round 1"`:
  - Input: `roundEndedAt: [t(5)]`, `currentRound: 1`, `isFinished: true`.
  - Expect `{ rounds: [5*MIN], liveMs: null }`.
- `"times the first round live before any round has ended"`:
  - Input: `roundEndedAt: []`, `currentRound: 1`, `now = Date.parse(t(2))`.
  - Expect `{ rounds: [], liveMs: 2*MIN }`.
- `"never reports a negative live time"`:
  - Input: `now` one minute before the last round end (client clock behind the server).
  - Expect `liveMs: 0`.
- `"returns null when round times weren't recorded"`, three cases (`it.each`):
  - `roundEndedAt` missing with `currentRound: 3`;
  - `[t(4)]` with `currentRound: 3` (not finished);
  - `[t(4)]` with `currentRound: 2` and `isFinished: true`.
- `"sums, averages and finds the longest and shortest round"`:
  - `roundTimeStats([4*MIN, 2*MIN, 11*MIN])` returns `{ totalMs: 17*MIN, averageMs: 17*MIN/3, longest: { round: 3, ms: 11*MIN }, shortest: { round: 2, ms: 2*MIN } }`.
- `"has no stats without finished rounds"`:
  - `roundTimeStats([])` returns `null`.

- [ ] **Step 2: Run them to see them fail**

Run (in `frontend/`): `npx vitest run --project unit src/core/roundTimes.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement**

- Add the type field.
- Implement both functions in `roundTimes.ts`. The expected number of entries is `isFinished ? currentRound : currentRound - 1`. If `roundEndedAt` is missing or has fewer entries than that, return `null`. Use only the first expected-count entries.
- `liveMs = isFinished ? null : Math.max(0, now - lastEnd)`, where `lastEnd` is the last entry or `createdAt`.
- On ties, longest and shortest take the earliest round.

- [ ] **Step 4: Run the tests**

Run: `npx vitest run --project unit src/core/roundTimes.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/types/game.types.ts frontend/src/core/roundTimes.ts frontend/src/core/roundTimes.test.ts
git commit -m "Work out round durations and stats"
```

---

### Task 3: RoundTimesChart

**Files:**
- Create: `frontend/src/presentation/components/RoundTimesChart/index.tsx`
- Test: `frontend/src/presentation/components/RoundTimesChart/RoundTimesChart.test.tsx`

**Interfaces:**
- Consumes: `RoundDurations`, `roundTimeStats` from Task 2; `formatDuration`.
- Produces: `export function RoundTimesChart({ durations }: { durations: RoundDurations | null })`. It is purely presentational; the caller passes durations with `liveMs` already ticking.

- [ ] **Step 1: Write the failing tests**

Bars are `rect` elements with `data-round="<n>"`, and the live bar also has `data-live="true"`. The tooltip `rect` has no `data-round`. Name each case and assert:

- `"draws a bar per finished round and a live bar"`:
  - `durations = { rounds: [4*MIN, 2*MIN, 11*MIN], liveMs: 3*MIN }`.
  - 4 `rect[data-round]`; exactly one has `data-live="true"`, with `data-round="4"`.
- `"shows total, average, longest and shortest"` (same input):
  - The stat values (for each label, `getByText(label).nextSibling?.textContent`, as in `GameStats.test.tsx`) are Total `17:00`, Avg `5:40`, Longest `R3 11:00`, Shortest `R2 2:00`.
  - Total covers finished rounds only.
- `"shows the live time as the total while round 1 runs"`:
  - `{ rounds: [], liveMs: 90_000 }` gives Total `1:30`, and Avg/Longest/Shortest `–`.
- `"has no average line or live bar for a game that ended in round 1"`:
  - `{ rounds: [5*MIN], liveMs: null }` gives 1 bar, no `[data-live]`, and no `line[data-average]`.
- `"draws an average line from two finished rounds"`:
  - `{ rounds: [4*MIN, 2*MIN], liveMs: null }` has one `line[data-average]`.
- `"renders zero-length rounds without NaN"`:
  - `{ rounds: [0, 0], liveMs: 0 }`; no attribute anywhere in the svg contains `NaN`.
- `"thins the round labels for long games"`:
  - 40 rounds of 1 min: 40 `rect[data-round]`, and at most 6 `text` elements whose content matches `/^R\d+$/`.
- `"says when round times weren't recorded"`:
  - `durations={null}` shows the text `Round times weren't recorded for this game.` and no svg.
- `"shows a round's time on hover"`:
  - `mouseEnter` on the round 3 bar shows the texts `Round 3` and `11:00`.

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run --project unit src/presentation/components/RoundTimesChart`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement `RoundTimesChart`**

- Copy `PlayerPointsChart`'s frame:
  - the `figure` / `figcaption` classes and `isMobile` dimensions;
  - grid line and label colors `rgba(255,255,255,0.07)` / `#9aa39d`;
  - the tooltip box `#222f29` with edge flipping;
  - the label font sizes.
- **Stat row:** use the `GameStats` tile pattern (label div then value div) in a 4-column grid above the svg.
- **Y-axis:** minutes. The step is the smallest of 1, 2, 5, 10, 15, 30 or 60 minutes that gives ≤ 5 grid lines over `max(longest bar, 1 min)`. Labels are `"5m"`, or `"1h"` and `"1h30m"` from an hour on.
- **Bars:** finished bars use the accent color `var(--color-accent)`; the live bar uses the same color at `opacity={0.4}`. Give every bar a minimum height of 2.
- **X labels:** `R<n>`, thinned with the points chart's `maxLabels` formula.
- **Average line:** a dashed `line` with `data-average`, only with ≥ 2 finished rounds.

- [ ] **Step 4: Run the tests**

Run: `npx vitest run --project unit src/presentation/components/RoundTimesChart`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/presentation/components/RoundTimesChart
git commit -m "Add a round times chart"
```

---

### Task 4: Round duration in the points tooltip

**Files:**
- Modify: `frontend/src/presentation/components/PlayerPointsChart/index.tsx`
- Test: `frontend/src/presentation/components/PlayerPointsChart/PlayerPointsChart.test.tsx`

**Interfaces:**
- Produces: `PlayerPointsChart` accepts an optional `roundDurations?: number[]`, the finished rounds' ms from `RoundDurations.rounds`.

- [ ] **Step 1: Write the failing tests**

- `"shows how long the round took in the tooltip"`:
  - Render with `players=[player("a","Anna",[10,20])]` and `roundDurations={[250_000, 60_000]}`, then `mouseEnter` the first circle.
  - Expect `getByText("Round 1 · 4:10")`.
- `"shows just the round without round times"`:
  - The same without `roundDurations` shows `getByText("Round 1")`.

- [ ] **Step 2: Run them to see the first fail**

Run: `npx vitest run --project unit src/presentation/components/PlayerPointsChart`
Expected: the duration test FAILS; the other passes.

- [ ] **Step 3: Implement**

- The tooltip's first line becomes `` `Round ${n} · ${formatDuration(roundDurations[n-1])}` `` when that entry exists, and `Round ${n}` otherwise.
- Widen the tooltip (`tooltipWidth`) by about 60 when the duration is shown, so the edge-flip test still holds.

- [ ] **Step 4: Run the tests**

Run: `npx vitest run --project unit src/presentation/components/PlayerPointsChart`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/presentation/components/PlayerPointsChart
git commit -m "Show the round's duration in the points tooltip"
```

---

### Task 5: Swipeable chart panel, wired into the game page

**Files:**
- Create: `frontend/src/presentation/pages/GamePage/components/GameCharts.tsx`
- Test: `frontend/src/presentation/pages/GamePage/components/GameCharts.test.tsx`
- Modify: `frontend/src/presentation/pages/GamePage/components/GameStats.tsx`, `GameStats.test.tsx`
- Modify: `frontend/src/presentation/pages/GamePage/GamePage.tsx` (the `elapsedMs` line ~L113, `GameStats` ~L326, `PlayerPointsChart` ~L394)

**Interfaces:**
- Consumes: `roundDurations` (Task 2), `RoundTimesChart` (Task 3), `PlayerPointsChart`'s `roundDurations` prop (Task 4), and `useElapsedTime(start, end)` from `@/core/hooks/useElapsedTime`.
- Produces: `export const GameCharts: React.FC<{ game: Game }>`.

- [ ] **Step 1: Write the failing tests**

`GameCharts.test.tsx` (build a `Game` fixture with two players, `currentRound: 3`, `roundEndedAt` of 2 entries):

- `"shows the points history and the round times side by side"`:
  - Both the headings `Points History` and `Round Times` are rendered.
- `"labels the page dots and marks the first as current"`:
  - `getByRole("button", { name: "Points history" })` has `aria-current="true"`, and the `Round times` button has no `aria-current`.
- `"switches to the round times on clicking its dot"`:
  - Stub `HTMLElement.prototype.scrollTo` with `vi.fn()`, click `Round times`, and expect `scrollTo` to have been called with `expect.objectContaining({ left: expect.any(Number) })`.
  - Then mark it current: set the active page in the click handler as well as from scroll.

`GameStats.test.tsx`: replace the #48 Time test with:

```tsx
// Issue #48: the running time moved from the stats into the round times chart
it("no longer shows a Time tile", () => {
    render(<GameStats currentRound={3} winCondition={1000} dealerName="Anna"/>);

    expect(screen.queryByText("Time")).toBeNull();
    expect(screen.getByText("Round")).toBeTruthy();
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run --project unit src/presentation/pages/GamePage/components`
Expected: the GameCharts tests FAIL (module not found), and the GameStats test FAILS (the Time tile is still there).

- [ ] **Step 3: Implement**

- **`GameStats`:** drop `elapsedMs`, the Time tile and the `formatDuration` import. Use the grid `grid-cols-3`.
- **`GameCharts`:**
  - Ticking: `lastEnd = game.roundEndedAt?.at(-1) ?? game.createdAt`, then `const liveMs = useElapsedTime(game.isFinished ? undefined : lastEnd)`. Call `roundDurations(game, Date.now())` and replace its `liveMs` with the hook's value, clamped to ≥ 0. The hook re-renders every second, so the live bar grows.
  - Scroll container: `flex overflow-x-auto snap-x snap-mandatory` with the scrollbar hidden (`[scrollbar-width:none]`). Each page is `w-full shrink-0 snap-start`.
  - The active page is `Math.round(scrollLeft / clientWidth)` on `scroll`. A dot click calls `scrollTo({ left: index * clientWidth, behavior: "smooth" })` and sets the page.
  - Dots: two small round buttons under the panel, the active one in `bg-accent`, the other in `bg-line`, each with a ≥ 44px touch target.
- **`GamePage`:** remove the `elapsedMs` line and its `useElapsedTime` import if unused, and the `elapsedMs` prop. Replace `<PlayerPointsChart …/>` with `<GameCharts game={game}/>`, keeping the `game.players.length > 0` guard.

- [ ] **Step 4: Run the full frontend checks**

Run (in `frontend/`): `npm test && npm run lint && npm run typecheck`
Expected: all pass. Also run `npm test` in `backend/`: all pass.

- [ ] **Step 5: Check it in the browser**

Run the app on the alternate ports, following the local-dev-ports memory (backend on 3601 with in-memory Mongo, Vite on 5174). Play two rounds, swipe the chart panel left on a mobile viewport, and confirm:
- the bars, the live bar ticking and the stat row;
- the dots switching pages on click;
- the points tooltip showing `Round 1 · m:ss`;
- no Time tile at the top.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/presentation/pages/GamePage
git commit -m "Move game time into a swipeable round times chart"
```
