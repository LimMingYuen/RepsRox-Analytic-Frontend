# RepsRox Analytic — Frontend

Angular dashboard for the training, nutrition, race-sim and weight data the
[Reps-Rox](https://github.com/LimMingYuen/Reps-Rox) Android app exports. It reads from the
[RepsRox Analytic backend](https://github.com/LimMingYuen/RepsRox-Analytic-Backend)
(ASP.NET Core + SQL Server).

## Pages

| Page | What it shows |
| --- | --- |
| **Overview** | Headline totals for the range, weekly volume, weight trend |
| **Training** | Volume by week or month; every exercise with best load and estimated 1RM, and its progress session by session; every session, opening to its sets |
| **Fuel** | Calories eaten against the day's plan, protein a day, meals checked in vs planned |
| **Race sims** | Finish times, each leg's average against its target, splits table |
| **Body** | Weigh-ins with a seven-day trend |
| **Import** | Drop the CSV files from the app's *Train → Export month*; lists and deletes imported months |

A date-range bar sits above every page. Presets (last month, 3 / 6 / 12 months) count back
from the newest data rather than from today, since the app only sends a month once it is over.

The look follows the app: dark only, near-black ground, the one hot-orange accent
(`#FF3B14`), Oswald for figures and headings, Inter for the rest. The accent and the one
second chart colour (blue) are checked to stay distinguishable under colour-blindness on the
card surface.

## Running locally

Prerequisites: Node.js `^22.22.2` or `>=24.15` (what Angular 22 needs), and the backend
running on `http://localhost:5080` (see its README).

```bash
npm install
npm start          # http://localhost:4200
```

`npm start` proxies `/api` to the backend (`proxy.conf.json`), so the browser only ever talks
to one origin. To load sample data, open **Import** and drop the CSV files from the backend's
`samples/` folder.

```bash
npm test           # unit tests (Vitest)
npm run build      # production build into dist/
```

## Deploying

The app calls the API on its own origin under `/api`. Serve `dist/repsrox-analytics/browser`
from the same host as the API with `/api` routed to it (a reverse proxy, or the API's own
static files), or add the dashboard's origin to the backend's `Cors:AllowedOrigins` and
change the base URL in `src/app/core/analytics-api.ts`.

## Layout

```
src/app/
├── core/      API client and response types, date-range state, formatting
├── shared/    Chart.js wrapper and chart theme, stat tile, range bar, loading/empty states
└── pages/     overview, training, nutrition, races, weight, import (lazy-loaded routes)
```
