# Vendored fonts

Static TTF cuts used only to render the Open Graph card in
`src/app/[locale]/opengraph-image.tsx`. Satori, which backs `next/og`, reads
raw font buffers and does not accept WOFF2, so the WOFF2 files that
`next/font/google` fetches for the site itself cannot be reused here.

| File | Family | Weight | Source |
|---|---|---|---|
| `hanken-800.ttf` | Hanken Grotesk | 800 | Google Fonts |
| `jetbrains-400.ttf` | JetBrains Mono | 400 | Google Fonts |

Both are licensed under the SIL Open Font License 1.1, which permits
redistribution alongside this repository.

Keep these in sync with the families declared in `src/app/[locale]/layout.tsx`.
The card renders Latin text only, so no Arabic cut is vendored.
