---
title: Setting up an online knowledge base
description: Why I’m building a personal IoT knowledge base with Astro — as a notepad first, a public wiki second — and how the stack and publishing flow fit together.
date: 2026-05-25
lang: en
tag: meta
duration: 5min
---

For a few years I’ve been tinkering with IoT — microcontrollers, sensors, flaky Wi‑Fi, and the usual trail of half-finished experiments. The learning curve was messy but steep. I kept notes in too many places: terminal scraps, random Markdown files, bookmarks I’d never open again.

This site is my attempt to put that somewhere durable.

<!-- IMAGE: Simple sketch — scattered sticky notes / terminal windows collapsing into a single wiki tree (Projects → IoT → ESP32 → …). -->

## Notepad first, publish second

The main purpose isn’t a polished tutorial empire. It’s a **personal notepad** that happens to be online:

- Capture what actually worked (and what didn’t)
- Keep project notes next to the code and hardware context
- Make it searchable and linkable so future-me can find it

If something is useful to others, great. If it’s rough, that’s fine — clarity for myself is the bar. I’ll tidy posts as they earn it.

## Why Astro (and a static wiki shape)

I wanted:

- **Markdown in git** — content lives in the repo, not a CMS database
- **Fast static pages** — no runtime to babysit for docs
- **Room to grow** — blog posts, project pages, and deeper IoT write-ups in one tree

Astro fits that model well: content collections, a predictable build, and a site you can host almost anywhere. The theme/base I’m using is a Vitesse-style Astro setup — enough structure for a wiki without fighting a heavy framework.

<!-- IMAGE: Content map diagram — `blog/` vs `projects/` vs nested IoT docs; arrows from “edit .md” to “built HTML”. -->

## How publishing works

Editing a `.md` file and waiting for FTP belongs in another decade. The flow I use now:

1. Change content in the repo (locally or on GitHub)
2. Push to `main`
3. CI builds the site and deploys it to the server
4. Refresh the live URL

Backups run before each deploy so a bad publish isn’t a disaster. I wrote that pipeline up separately: [Auto-deploy a static site from GitHub to your own server](./deploy-strategy).

<!-- IMAGE: Mini pipeline strip — Markdown → GitHub → Actions → live wiki. Same idea as the deploy post hero, smaller. -->

## What’s in the knowledge base

Expect a mix of:

- **Short blog notes** — process, tooling, meta posts like this one
- **Project pages** — what I’m building and why
- **IoT deep dives** — device setup, libraries, wiring, gotchas (starting with things like ESP32)

Structure will evolve. Sections get added when there’s enough material to justify them, not because a sidebar template demanded empty links.

## A note on AI assistance

I experiment a lot with LLMs — for drafting, refactoring, and unblocking. Some pages will still carry that texture. I’ll clean the worst of it over time; treat early posts as living drafts.

## What’s next

- Fill in real projects instead of placeholders
- Grow the IoT section as experiments stabilize
- Keep the deploy path boring so writing stays the hard part

I’ll update this overview as the shape of the knowledge base settles. More soon — mostly in the form of actual notes, not more meta.
