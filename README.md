# weltkugl.net — Personal Wiki & Knowledge Base

Built on [**astro-theme-vitesse**](https://github.com/kieranwv/astro-theme-vitesse) by Kieran Wang — a minimal, SEO-friendly Astro theme with Vue and UnoCSS.

This repo powers a personal wiki and knowledge base at `https://www.weltkugl.net/www/`. The site is a static Astro build that deploys automatically from GitHub to a self-hosted Netcup server.

---

## What This Is

A living knowledge base for:

- **IoT & Home Automation** — ESP32, openHAB, sensors, device monitoring
- **Web Development** — patterns, tooling, experiments
- **Software Architecture** — notes, trade-offs, practical write-ups
- **Blog & Talks** — longer-form thoughts and presentations

Content lives as plain Markdown in this repo. Push to `main` → site builds and deploys in ~60 seconds.

---

## Architecture

```
┌─────────────┐     push to main      ┌──────────────────┐
│  GitHub     │ ─────────────────────→│  GitHub Actions  │
│  (this repo)│                       │  - npm ci        │
│  .md files  │                       │  - npm run build │
│  Astro code │                       │  - backup server │
└─────────────┘                       │  - rsync dist/   │
                                      └────────┬─────────┘
                                               │
                                               ▼
                                      ┌──────────────────┐
                                      │  Netcup Server   │
                                      │  /var/www/...    │
                                      │  /www/ ← wiki    │
                                      │  / ← portal page │
                                      └──────────────────┘
```

- **Content source of truth:** This GitHub repo (plain `.md` files)
- **Build:** GitHub Actions (Ubuntu, Node 22)
- **Host:** Netcup VPS (Apache)
- **Path:** `https://www.weltkugl.net/www/` (portal page lives at root `/`)

---

## Content Collections

Content is organized in Astro collections under `src/content/`:

| Collection | Location | Purpose |
|-----------|----------|---------|
| `blog` | `src/content/blog/` | Blog posts, notes, talks |
| `iot` | `src/content/iot/` | IoT knowledge base articles |
| `pages` | `src/content/pages/` | Static pages (e.g. `/md-style`) |

### IoT Knowledge Base

The IoT section has its own sub-navigation (`ProjectSubnav.astro`) with these topics:

- **ESP32** — Firmware, Wi-Fi/BLE, MQTT, embedded patterns
- **openHAB** — Rules, items, bindings, smart-home integration
- **Sensors** — Hardware notes, calibration, data pipelines

New sections are configured in `src/projects/iot-config.ts`.

---

## Quick Start (Local Development)

> Node.js ≥ 18 required. This project uses Node 22 on CI.

```bash
# Install dependencies
npm install

# Start dev server (port 1977)
npm run dev

# Build for production
npm run build

# Preview the production build
npm run preview
```

### Tech Stack

| Layer | Tool |
|-------|------|
| Framework | [Astro](https://astro.build/) 5.x |
| Components | [Vue](https://vuejs.org/) 3.x SFC |
| Styling | [UnoCSS](https://unocss.dev/) |
| Content | Markdown + [MDX](https://mdxjs.com/) |
| Icons | [Iconify](https://iconify.design/) |
| Utilities | [VueUse](https://vueuse.org/), [Lodash-es](https://lodash.com/) |
| Syntax Highlighting | [Shiki](https://shiki.style/) (github-light / github-dark) |

---

## Deployment

### How it works

Every push to `main` triggers `.github/workflows/deploy.yml`:

1. **Checkout** repo
2. **Install** dependencies (`npm ci`)
3. **Lint** (`npm run lint`)
4. **Build** Astro to `dist/` (`npm run build`)
5. **Backup** current site on the server (`~/bin/backup-wiki.sh`)
6. **Deploy** `dist/` to server via `rsync --delete`

Backups are retained for 14 days in `~/wiki-backups/` on the server.

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `SSH_HOST` | Netcup server IP or domain |
| `SSH_USERNAME` | SSH user for deployment |
| `SSH_PRIVATE_KEY` | Private SSH key (ed25519) |
| `DEPLOY_PATH` | Absolute server path to `www/` (e.g. `/var/www/weltkugl.net/www/`) |

### Manual Rollback (Server)

If a deploy breaks something, SSH into the server and run:

```bash
# Roll back to most recent backup
~/bin/rollback-wiki.sh

# Or specify a specific backup
~/bin/rollback-wiki.sh wiki-20250801-120000.tar.gz
```

---

## Project Structure

```
.
├── .github/workflows/deploy.yml   # CI/CD: build & deploy
├── src/
│   ├── components/                # Vue & Astro components
│   ├── content/                   # Markdown content collections
│   │   ├── blog/
│   │   │   ├── notes/
│   │   │   ├── talks/
│   │   │   └── post-1.md
│   │   ├── iot/
│   │   │   ├── esp32/
│   │   │   ├── openhab/
│   │   │   └── sensors/
│   │   └── pages/
│   ├── layouts/                   # BaseLayout.astro
│   ├── pages/                     # Astro routing
│   ├── projects/                  # Section configs (iot-config.ts)
│   ├── styles/                    # prose.css, global.css, dot.css
│   └── utils/                     # Content helpers
├── public/                        # Static assets (images)
├── astro.config.ts                # Astro config (base: '/www')
├── uno.config.ts                  # UnoCSS shortcuts & presets
└── DEPLOY_SETUP.md                # Detailed server setup guide
```

---

## Adding Content

### New Blog Post

Create a file in `src/content/blog/` or a subfolder:

```md
---
title: "My New Post"
description: "A short summary"
date: 2025-08-01
duration: 5 min read
tag: web-dev
---

Your content here.
```

### New IoT Article

Create a file in the appropriate `src/content/iot/<section>/` folder:

```md
---
title: "MQTT Setup on ESP32"
description: "Connecting ESP32 to MQTT broker"
order: 1
---

Your content here.
```

`order` controls sort position within the section. Articles without `order` sort alphabetically by title.

### New IoT Section

1. Add section metadata to `src/projects/iot-config.ts`:

```ts
({
  slug: 'newsection',
  title: 'New Section',
  description: 'What this section covers.',
})
```

```ts
({ text: 'New Section', href: '/projects/iot/newsection' })
```

3. Create `src/content/iot/newsection/overview.md`

---

## Customization

### Site Config

Edit `src/site-config.ts` for:
- Author name, title, description
- Header navigation links
- Social links
- Footer links

### Theme / Colors

Edit `uno.config.ts` for:
- Color tokens (`bg-main`, `text-main`, etc.)
- UnoCSS shortcuts
- Font families (Inter, DM Mono)

---

## Original Theme

This project is built on [**astro-theme-vitesse**](https://github.com/kieranwv/astro-theme-vitesse) by [Kieran Wang](https://github.com/kieranwv/).

Vitesse features:
- 100/100 Lighthouse performance
- Responsive, SEO-friendly
- Light / Dark theme toggle
- Markdown & MDX support
- Vue SFC component support
- Auto-generated sitemap and RSS
- UnoCSS for styling

[MIT License](./LICENSE) © 2024 Kieran Wang
