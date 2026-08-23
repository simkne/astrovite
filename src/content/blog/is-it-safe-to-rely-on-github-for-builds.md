---
title: "Is it safe to rely on GitHub too much?"
description: "Evaluating the risk of depending on GitHub Actions for building this site, and comparing it against compiling on the Netcup VPS, a server-side git repo, or self-hosted CI."
date: 2026-08-20
lang: en
tags: [devops]
duration: 10min
image:
  src: imgs/github_deploy_header.jpg
  alt: Pipeline from Markdown through GitHub Actions to a live deploy
---

This is not a conclusion. It is a working document for deciding whether I keep building this site on GitHub Actions or
move the build onto my own server.

## The setup today

Push to `main` and GitHub Actions takes over:

1. `checkout` the repo
2. `npm ci` — install dependencies
3. `npm run lint`
4. `npm run build` → `dist/`
5. Backup the live site on the server over SSH
6. Pipe `dist/` over SSH and atomically swap it into the web root

The build happens entirely on GitHub's infrastructure. My Netcup VPS only ever receives a finished folder of static
files — it never compiles anything. That's the arrangement that post
[deploy-strategy](/www/posts/deploy-strategy/) describes.

This framing matters: **hosting the code** and **running the build** are two separate dependencies on GitHub, and they
carry very different risk profiles.

## The unglamorous bit that makes this harder to reason about

There are three things this site actually depends on before a change reaches the live site:

| Dependency | What breaks if it fails |
|------------|-------------------------|
| GitHub repo | Source of truth for content and code |
| GitHub Actions | The actual build + deploy |
| GitHub REST API | The web editor (writes notes by committing to the repo) |

They share one failure domain: GitHub. So an outage doesn't just pause deploys, it pauses *content creation* too,
because the editor writes back to the repo through the API.

## Option A — build on the Netcup server directly

Install Node on the VPS and have the build happen there instead of on GitHub. Push to GitHub, GitHub fires a webhook
at the server, a small script does `git pull && npm ci && npm run build`, then swaps the result into place. No CI
runner, no Actions minutes, no build dependency on GitHub at all.

**Advantages**

- Removes GitHub Actions as a build-time dependency entirely
- Builds on hardware I control; no shared-infrastructure surprises
- Same mental model as the current setup, just with the build moved home
- Keeps GitHub purely as remote storage + trigger — a role it can be replaced in a minute

**Disadvantages / what I'd own**

- I maintain the build environment (Node version, npm cache, dependency updates)
- A Node install on a public-facing server is more attack surface to keep patched
- Backups / rollbacks currently get kicked off *by CI* — that trigger would move into my script
- Webhooks need an endpoint, auth, and monitoring; a missed webhook = a silent stale site
- If the server itself is down, I can't deploy at all — the failure moves to *my* box

## Option B — use my server's own git (self-hosted forge + CI)

Move the primary repository onto the server: a lightweight forge like Gitea, with Gitea Actions or Woodpecker doing
the build. GitHub, if it stays, becomes a public mirror rather than the source of truth.

**What I'd need to set up**

- Gitea on the VPS (single binary, light) or another host
- A CI system wired to it (Gitea Actions is built in; Woodpecker also integrates)
- Webhook / trigger to build and deploy on push
- Re-created repo, remote rewiring on my local clones, adjusted workflow

**Advantages**

- Full sovereignty: code, build, and deploy all on my infrastructure
- No dependency on GitHub's free tier, rate limits, or policy changes
- GitHub stays as an optional public mirror, so visibility isn't lost

**Disadvantages / what I'd own**

- Everything in Option A, plus I now operate a git forge and CI services — real maintenance
- Losing GitHub's ecosystem: Issues, PRs, Actions marketplace, Copilot, the open-source social graph
- More moving parts to the exact degree I was trying to reduce them
- Moving the *source of truth* is a bigger commitment than moving the build

## The counter-argument — why this might not be risky at all

I want to steelman keeping the build on GitHub, because the instinct to self-host everything isn't automatically
right.

**Outages are rare and short-lived.** GitHub has had a handful of notable extended incidents, but for most of the
past decade it's been extraordinarily reliable. The failure mode I fear is "can't deploy for a few hours," not "lose
the site."

**The deploy has a manual escape hatch already.** For a static site there's no cluster, no migrations, no runtime
state. If Actions is down, I build locally on my laptop and push `dist/` over SSH by hand. The tar-over-SSH fallback
in my workflow even documents how. That turns "GitHub is down" from a blocker into an inconvenience.

**Public repos get generous free minutes.** For a non-commercial site the Actions quota is effectively
non-constraining. Minutes running out is not the realistic failure.

**Content and code are portable text.** Even the worst case — GitHub disappearing — loses me the *history and
issue tracker*, not the content. I clone from any mirror and rebuild. Nothing is bricked.

**The editor's GitHub dependency is real but separate.** It's the sharpest risk here, but it's about the *API token*,
not the build. And it's independently fixable (save locally, use a server-side API, or accept the blip) without
touching the deploy pipeline at all.

**Self-hosting moves the risk to where I have less expertise.** GitHub's SRE team is better at keeping builds up than
I am at configuring a hardened VPS. There's a real chance I trade an occasional GitHub hiccup for my own
misconfiguration, silently broken webhook, or an unpatched CVE.

## What this comes down to

| | Keep GitHub Actions | Build on VPS (webhook) | Self-hosted forge + CI |
|---|---|---|---|
| Build dependency on GitHub | Yes | No | No |
| Infrastructure I operate | Little | Some | A lot |
| Risk profile | Third-party reliability | My own VPS reliability + webhook health | Same as webhook, plus forge/CI upkeep |
| Effort to set up | None | Small | Significant |
| Locks me into GitHub | Yes (build) | No | No |
| Drops GitHub's ecosystem? | No | No | Yes |

The honest reading: the *build* is the piece GitHub is best at and the easiest to replace with a manual override.
The *code + editor* dependency is the part that actually affects my daily flow, and it's the one GitHub is hardest to
walk away from socially.

I don't have a conclusion yet. That's the point of writing this down — the table above is where I'll make the call:
whether the occasional, short, escapable GitHub Actions blip is worth trading for the maintenance and attack surface
of running the build and the forge myself.

## Next step

Before deciding, I'll test the manual escape hatch for real — build locally and hand-deploy to confirm the fallback
actually works when Actions can't run. If that's as painless as it looks, the "risk" shrinks to a footnote, and
staying on GitHub Actions becomes the defensible default.
