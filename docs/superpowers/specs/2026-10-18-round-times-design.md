# Round times in the graph area

Branch: `feat/game-timer` (builds on 5a52eac, "Show how long a game has been running", issue #48)

## Goal

Show how long each round takes, where the points graph is, instead of a running Time tile at the top of the game page. Players swipe the graph panel to the left to get a second chart with per-round times and stats.

## Decisions

- The Time tile is removed from the top of the game page.
- The graph area becomes a swipeable panel with two pages: Points History and Round Times.
- Round 1 is counted from game creation (`createdAt`), so it includes any lobby waiting time. This matches the total duration the history page already shows.
- Games without recorded round times (older games, or games in progress when this ships) show an empty state instead of wrong numbers.
- The history page keeps its total game duration, unchanged.

## Backend

**Model** (`backend/models/Game.js`): add `roundEndedAt: { type: [Date], default: [] }` to the game schema.

**Recording** (`GamesService.nextRound`): when a round completes, push `new Date()` onto `roundEndedAt`. The final round, the one that produces a winner, is recorded too, at the same moment as `finishedAt`. Other mutations (`resetRound`, `updateHistoryScore`, adding or removing players) don't change it.

**API** (`GamesService.getGameState`): return `roundEndedAt` (an empty array if missing).

**Duration of round i** (1-based): `roundEndedAt[i-1] - (i === 1 ? createdAt : roundEndedAt[i-2])`.

## Frontend

### Types

Add `roundEndedAt?: string[]` to the game type in `src/types/game.types.ts`.

### Logic: `src/core/roundTimes.ts`

Pure functions, unit-tested in `roundTimes.test.ts`:

- `roundDurations(game, now: number)` returns `{ rounds: number[]; liveMs: number | null } | null`:
  - `rounds`: durations in ms of the finished rounds, in order.
  - `liveMs`: how long the current round has been running (`now` minus the end of the last finished round, or minus `createdAt`); `null` once the game is finished.
  - Returns `null` ("not recorded") when `roundEndedAt` doesn't cover every finished round. A finished game should have `currentRound` entries; one still running should have `currentRound - 1`.
- `roundTimeStats(rounds: number[])` returns `{ totalMs, averageMs, longest: { round, ms }, shortest: { round, ms } } | null` over finished rounds only (`null` when there are none). The live round is excluded.

The live round ticks every second through the existing `useElapsedTime` hook, started from the end of the last finished round.

Durations are formatted with the existing `formatDuration` (`src/core/duration.ts`).

### Components

**`GameStats`**: remove the Time tile and the `elapsedMs` prop. Three tiles: Round, Goal, Dealer, in a 3-column grid. `GamePage` stops passing `elapsedMs`.

**`GameCharts`** (`src/presentation/pages/GamePage/components/GameCharts.tsx`): replaces the direct `PlayerPointsChart` render in `GamePage`.

- A horizontal container with `overflow-x: auto`, `scroll-snap-type: x mandatory` and the scrollbar hidden. It holds two full-width pages (`scroll-snap-align: start`): `PlayerPointsChart`, then `RoundTimesChart`. Native touch scrolling handles the swipe, so no dependency is added.
- Below it, two dot buttons (`aria-label="Points history"` / `"Round times"`, `aria-current` on the active one). The active page is tracked from the container's scroll position. Clicking a dot scrolls to its page, which covers desktop users without touch.

**`RoundTimesChart`** (`src/presentation/components/RoundTimesChart/index.tsx`): same card styling as `PlayerPointsChart` (`figure`, `bg-surface`, `border-line`, `rounded-[18px]`, same SVG text colors and mobile sizing).

- Title "Round Times".
- Stat row: Total · Avg · Longest (`R4 11:20`) · Shortest. While only the live round exists, Total shows the live time and the other stats show "–".
- SVG bars: one per finished round, in the accent color. The live round's bar is drawn dimmer and grows as the timer ticks. The y-axis is in minutes with a step that fits the longest bar; the x labels are `R1`, `R2`, …, thinned on mobile like the points chart.
- A dashed horizontal line at the average (finished rounds only, at least two rounds).
- Hover or tap on a bar shows a tooltip, "Round 3", "4:10", using the same tooltip style and edge flipping as the points chart.
- Empty state when `roundDurations` returns `null`: "Round times weren't recorded for this game."

**`PlayerPointsChart`**: takes an optional `roundDurations?: number[]` prop. When present, the tooltip's first line becomes `Round 3 · 4:10`.

## Testing (TDD: each test written and seen failing first)

Backend (`backend/tests/games.test.mjs`):
- `roundEndedAt` starts empty, gains exactly one entry per completed round, and gains its last entry when the game ends (equal to `finishedAt`).
- Its timestamps never decrease and are all at or after `createdAt`.
- `resetRound` doesn't add an entry.

Frontend:
- `roundTimes.test.ts`:
  - durations for finished rounds;
  - the live round while running, and none once finished;
  - `null` when data is missing or incomplete;
  - stats (total, average, longest, shortest), with the live round excluded.
- `RoundTimesChart.test.tsx`: one bar per round plus the live bar, the stat row, the empty state.
- `GameCharts.test.tsx`: both pages render; the dots have labels and the first is active.
- `GameStats.test.tsx`: no Time tile any more (update the test #48 added for the tile to match the new behavior).
- `PlayerPointsChart`: the tooltip shows the round's duration when given.

Done when the backend and frontend test suites, frontend lint and typecheck all pass.

## Out of scope

- Pausing the timer, or excluding lobby waiting time.
- Backfilling round times for existing games.
- Per-player time stats (e.g. who submits slowest).
