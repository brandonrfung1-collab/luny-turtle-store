# Luny Turtle · demo store

A demo website and commission store for **Luny Turtle** ([@artbylunyturtle](https://www.instagram.com/artbylunyturtle/)),
Esther Jun's hand-drawn portrait commissions. It runs on your own computer, or as a static demo on Vercel.
**No real payments are taken and nothing is sent to Esther.**

## Run it

You need [Node.js](https://nodejs.org) 18 or newer.

```bash
cd luny-turtle-store
npm install
npm run dev
```

Then open **http://localhost:5173**.

| Page | What it shows |
| --- | --- |
| `/` | Home: hero, the four drawing types, how it works, gallery teaser, holiday block |
| `/gallery` | All drawings with filters and a lightbox |
| `/shop` → `/shop/full-portrait` | The commission builder: occasion, people and pets, scene idea, reference photos, gift note, live price |
| `/cart` → `/checkout` | Cart and a demo checkout (card `4242 4242 4242 4242`, any future date, any CVC; `4000 0000 0000 0002` shows a decline) |
| `/order/<id>` and `/track` | Order confirmation and tracking with a status timeline |
| `/studio` | Esther's dashboard: see each order's full brief and photos, move it through sketch → ink → shipped. Demo passcode: `turtle` |
| `/about`, `/faq` | Esther's story and common questions |

Demo orders are saved in `server/data/orders.json` and uploaded reference photos in `server/data/uploads/`.
Delete those to start fresh.

To run the optimized build instead: `npm run build && npm start`.

## Vercel demo

The repo deploys to Vercel as a static site with no server. `vercel.json` already sets everything, so on Vercel you
just **Add New → Project → import this repo → Deploy** with the default settings.

- The build is `npm run build:vercel`, which turns on `VITE_STATIC_DEMO=1` (from `.env.vercel`).
- With no server, demo orders and reference photos are saved in each visitor's own browser (localStorage). A visitor
  can place an order, track it, and see it in `/studio` (passcode `turtle`), but nobody else sees it.
- The site asks search engines not to index it (`noindex` meta tag, `robots.txt`, `X-Robots-Tag` header).
  Turning on Vercel's Deployment Protection keeps the link private too.

To try the Vercel build locally: `npm run build:vercel && npx vite preview`.

## Where to change things

- Prices and the four drawing types: `src/data/products.ts` (and mirror the numbers in `server/catalog.js`).
- Business facts, turnaround, shipping, About copy: `src/data/site.ts`.
- Drawings: `public/art/*.jpg`, listed in `src/data/artworks.ts`.
- Colors, fonts, buttons: `src/styles/base.css`.

See `DEMO_NOTES.md` for what is confirmed from Esther's posts and what is a placeholder.
