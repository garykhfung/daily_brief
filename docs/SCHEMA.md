# Daily Brief data schema (v1.1)

Backward compatible with v1. Existing `image` fields keep working; desks should prefer `imageUrl` from the next batch.

## Volume target
Aim for **~25–30 items per tab** when real sources in the past 24–48h allow. Prefer quality over padding; empty sections stay empty. No invented items.

## Desk hand-off format (what AI News Desk / Gaming News Desk send to Daily Brief Site)
{
  "tab": "ai" | "gaming",
  "generatedAt": "2026-10-08T10:30:00+08:00",   // ISO 8601, HKT offset
  "items": [ Item, ... ]
}

## Item
{
  "id": "ai-2026-10-08-001",          // unique, tab-date-seq
  "title": "string",                  // original-language headline OK
  "summary": "1-2 sentences, Chinese",
  "source": "The Verge",
  "sourceUrl": "https://...",         // required, real, checkable
  "publishedAt": "2026-10-07T22:15:00+08:00", // ISO 8601 HKT
  "category": "<section id below>",
  "platforms": ["PC","Switch 2"],     // gaming only, optional
  "releaseDate": "2026-11-20" | "TBA",// gaming release items only, only if sourced
  "imageUrl": "https://..." | null,   // preferred desk hand-off field; og:image / article hero only
  "image": "https://...",             // accepted alias of imageUrl (either OK on hand-off)
  "imageAlt": "string",               // required when image/imageUrl is set
  "uncertain": false,                 // true = flagged 未確認
  "note": "string"                    // optional, e.g. why uncertain
}

### Image rules
- Prefer source `og:image` or clear article hero on the same page as `sourceUrl`.
- Skip (set `imageUrl: null`) if none, paywalled, or license/ownership unclear.
- Never invent URLs or hotlink random CDN noise.
- Site storage persists the URL as `image` in data.json (+ `imageAlt` when present).

## Section ids
AI tab ("ai"):
  frontier          Frontier model 新聞
  open-source       Open-source model 新聞
  hk                香港 AI 新聞＋香港可用模型／服務
  hardware-shipping 硬件：已上市裝置
  hardware-gadgets  硬件：消費 AI gadgets
  companies         AI 相關公司新聞
  markets           AI 相關股票市場新聞 (quote sources only, no advice)
Gaming tab ("gaming"):
  pc-switch2        PC／Switch 2 新作同發售 (shown first)
  news              遊戲新聞（新遊戲、公司）
  other-consoles    其他主機
  other             其他遊戲新聞

## Site file: data/data.json (latest) + data/archive/YYYY-MM-DD.json
{
  "updatedAt": "ISO HKT",
  "timezone": "Asia/Hong_Kong",
  "tabs": [
    { "id": "ai", "label": "AI", "sections": [
        { "id": "frontier", "label": "Frontier models", "items": [Item...] }, ...
    ]},
    { "id": "gaming", "label": "Gaming", "sections": [...] }
  ]
}
Daily Brief Site merges desk hand-offs into this file (sections in the order above, items newest first).
On merge: normalize `imageUrl` → `image`; drop image fields when null/empty; keep `imageAlt` only when `image` is set.
