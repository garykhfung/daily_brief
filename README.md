# Gary's Daily Brief

Static AI + Gaming news brief. Plain HTML/CSS/JS, no build step, published with GitHub Pages.

Live (after Pages is enabled): https://garykhfung.github.io/daily_brief/

## Data flow

1. **Desks hand off JSON** per [`docs/SCHEMA.md`](docs/SCHEMA.md) — one payload per tab (`ai` / `gaming`) with `items[]`.
2. **Daily Brief Site** merges desk hand-offs into the site file shape: `tabs → sections → items` (section order fixed in the schema; items newest first).
3. **Replace** [`data/data.json`](data/data.json) with today’s merged brief (`updatedAt` in HKT / `+08:00`).
4. **Archive** a copy as `data/archive/YYYY-MM-DD.json` and append that date to [`data/archive/index.json`](data/archive/index.json) (array of date strings). The site reads `index.json` for the optional archive selector.

Validate before commit:

```bash
python3 scripts/validate.py
# or: python3 scripts/validate.py data/archive/2026-10-08.json
```

## Local preview

```bash
python3 -m http.server 8080
# open http://127.0.0.1:8080/
```

Tabs use the URL hash (`#ai`, `#gaming`). Section filter pills are per-tab. Times display in `Asia/Hong_Kong`.

## Deploy (GitHub Pages)

Gary: set **Settings → Pages → Source** to **GitHub Actions**. The workflow [`.github/workflows/pages.yml`](.github/workflows/pages.yml) deploys the site root (HTML/CSS/JS + `data/` + `docs/`) on push to `main` and on `workflow_dispatch`.

Repo must stay **public** for free Pages. Includes `.nojekyll` so GitHub does not run Jekyll.

## Files

```
/
├── index.html
├── styles.css
├── app.js
├── favicon.svg
├── .nojekyll
├── data/
│   ├── data.json                 # latest brief
│   └── archive/
│       ├── index.json            # ["YYYY-MM-DD", ...]
│       └── YYYY-MM-DD.json
├── docs/
│   ├── SCHEMA.md
│   └── agents/house-style.md
├── scripts/validate.py
└── .github/workflows/pages.yml
```

Light mode only. House style matches [move_house](https://github.com/garykhfung/move_house) (teal/slate tokens).
