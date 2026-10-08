# House style — Gary's Daily Brief

Follow the same visual system as [move_house](https://github.com/garykhfung/move_house) / pg_dashboard.

## Light mode only

- `color-scheme: light` on `:root` and `<meta name="color-scheme" content="light">`
- No theme toggle, no dark-mode media queries, no dark palette variants

## Tokens

| Token | Value |
|-------|-------|
| `--primary` | `#044147` |
| `--text` | `#1e293b` |
| `--bg` | `#f8fafc` |
| `--surface` | `#ffffff` |
| `--border` | `#e2e8f0` |
| `--muted` | `#64748b` |
| `--accent-surface` | `#e6f4f3` |
| `--radius` | `8px` |
| `--font` | `system-ui, -apple-system, "Segoe UI", "PingFang HK", "Microsoft JhengHei", sans-serif` |

Semantic accents: `--ok` `#06bb8c`, `--warning` `#f59e0b`, `--critical` `#db1251`, `--monitor` `#0679c5`, `--pending` `#94a3b8`.

## Patterns

- Sticky header, brand mark square, teal intro gradient wash
- Cards: white surface, 1px border, 8px radius, optional 3px left accent
- Pills via `color-mix` (platforms, 未確認, status)
- Filter pills: rounded-full buttons; active = accent-surface + primary text
- Mobile-first; max content width ~960px
- Escape all untrusted text (`textContent` only — never `innerHTML` of JSON fields)
- No external CDNs, no build step

## Do not

- Purple/indigo AI-default themes, cream+terracotta, broadsheet layouts
- Dark mode, glow effects, multi-layer shadows, emoji decoration
- Cards in the hero (this site uses cards for news items — interactive list content)
