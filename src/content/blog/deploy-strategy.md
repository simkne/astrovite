---
title: Auto-deploy a static site from GitHub to your own server
description: How to wire GitHub Actions, SSH, and simple backup scripts so every push to main builds and deploys your Astro (or any static) site — with rollback when something breaks.
date: 2026-08-01
lang: en
tag: devops
duration: 12min
---

Editing Markdown in a repo is only half the story. The other half is getting those changes onto a real server without FTP, manual builds, or “I’ll deploy it later.” This post walks through a self-hosted deploy pipeline: **push to** `main` **→ CI builds → backup the live site → sync the new build over SSH**.

It works for Astro, Vite, Next static export, plain HTML — anything that outputs a folder of static files.

## What you end up with

| Piece                     | Role                                                |
| ------------------------- | --------------------------------------------------- |
| GitHub repo               | Source of truth for content and site code           |
| GitHub Actions            | Builds on every push to `main`                      |
| Deploy SSH key            | Lets Actions log into your server without passwords |
| `rsync` over SSH          | Copies `dist/` to the web root                      |
| Backup + rollback scripts | Snapshot before each deploy; restore if needed      |

Visitors still hit your domain as usual. You never SSH in just to publish a typo fix.

## Prerequisites

- A GitHub repository with a working static build (`npm run build` → `dist/` or similar)
- A VPS or shared host with SSH access and a web root you control (Apache, Nginx, Caddy — doesn’t matter)
- Node.js available in CI (Actions provides this; you don’t need Node on the server for a static deploy)

Optional but useful: the site lives in a **subdirectory** (e.g. `/wiki/`) while a separate landing page stays at `/`. The same pipeline works for a site at the domain root — you only change the deploy path.

## 1. Create a deploy-only SSH key

On your laptop, generate a key pair used only for CI:

```bash
ssh-keygen -t ed25519 -a 100 -f ~/.ssh/github_deploy -C "github-actions"
# Press Enter twice — no passphrase (CI can’t type one)
```

You get:

- `~/.ssh/github_deploy` — **private** key → GitHub secret
- `~/.ssh/github_deploy.pub` — **public** key → server `authorized_keys`

Keep this key separate from your personal SSH key. If it leaks, revoke it without locking yourself out of the box.

### Put the public key on the server

SSH in as the user that owns the web files, then:

```bash
mkdir -p ~/.ssh && chmod 700 ~/.ssh
# Append the contents of github_deploy.pub to authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

Or from your laptop:

```bash
ssh-copy-id -i ~/.ssh/github_deploy.pub your-user@your-server
```

Test:

```bash
ssh -i ~/.ssh/github_deploy your-user@your-server
# Should log in without a password prompt
```

## 2. Backup and rollback on the server

Before every deploy, snapshot the current web root. If the new build is broken, restore in one command.

Create `~/bin` on the server and add two small scripts.

### Backup

Conceptually:

1. Point at your web root (e.g. `/var/www/example.com/public`)
2. Write a timestamped `.tar.gz` into `~/site-backups/`
3. Delete archives older than N days (14 is a sensible default)

Skip the backup quietly if the directory is empty — that happens on the first deploy.

### Rollback

1. List available archives
2. Default to the newest if you don’t pass a name
3. Confirm interactively
4. Snapshot the *current* (broken) state as an emergency archive
5. Wipe the web root and extract the chosen backup

Wire both scripts as executable (`chmod +x`). If your web root isn’t the default path in the scripts, edit that one variable in both places.

## 3. GitHub Actions secrets

In the repo: **Settings → Secrets and variables → Actions**.

| Secret            | Meaning                                                     |
| ----------------- | ----------------------------------------------------------- |
| `SSH_HOST`        | Server IP or hostname                                       |
| `SSH_USERNAME`    | SSH user that owns the web files                            |
| `SSH_PRIVATE_KEY` | Full private key text (`-----BEGIN …` through `-----END …`) |
| `DEPLOY_PATH`     | Absolute path to the web root, trailing `/` recommended     |

`DEPLOY_PATH` should be the folder that receives the *built* site — often a subdirectory if a portal or other app lives at the domain root.

## 4. Watch out for blanket redirects

If an `.htaccess` or Nginx rule sends *everything* to your app subdirectory (`RedirectMatch` / `rewrite ^ /wiki/`), your root landing page disappears. Prefer:

- Force HTTPS / www as needed
- Leave `/` alone for the portal (or whatever lives there)
- Serve the static site only under its own path

Same idea on Nginx: location blocks, not a single catch-all that swallows the homepage.

## 5. The workflow

Create `.github/workflows/deploy.yml`. The shape looks like this:

```yaml
name: Build and Deploy

on:
  push:
    branches: [main]
  workflow_dispatch: # manual “Run workflow” button

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run lint # optional but catches breaks before ship
      - run: npm run build

      - name: Backup on server
      # write the private key, ssh-keyscan host, then:
      # ssh … "bash ~/bin/backup-wiki.sh"

      - name: Deploy
      # rsync -avz --delete ./dist/ user@host:$DEPLOY_PATH
```

Important details:

- `concurrency` **+** `cancel-in-progress` — rapid commits don’t stack stale deploys.
- `--delete` **on rsync** — removed pages disappear from the server too. Pair that with the pre-deploy backup.
- **No rsync on the server?** Pipe a tarball over SSH instead: `tar -czf - -C ./dist . | ssh … 'rm -rf "$DEPLOY.new" && mkdir -p "$DEPLOY.new" && tar -xzf - -C "$DEPLOY.new" && rm -rf "$DEPLOY" && mv "$DEPLOY.new" "$DEPLOY"'`. The swap is atomic, so a failed transfer never leaves a half-deployed site.
- **Reuse the same SSH key file** between the backup and rsync steps in one job.

If you already have a lint-only CI workflow, fold lint into this job and drop the duplicate.

## 6. First deploy checklist

1. Commit the workflow (and any `.htaccess` / config fixes).
2. Push to `main`.
3. Open the **Actions** tab and watch the run.
4. On the server: confirm files under `DEPLOY_PATH` and a new tarball in the backup directory.
5. Hit the site in a browser — root and subdirectory as applicable.

First run often logs “nothing to backup.” That’s expected.

## 7. Day-to-day: edit, commit, refresh

After that, the loop is deliberately boring:

1. Edit a Markdown file on GitHub (or locally and push).
2. Wait for the Action to finish (~1 minute for a small site).
3. Hard-refresh the live URL.

No build machine required for content edits. The CI runner is the build machine.

## 8. When a deploy goes wrong

SSH in and run the rollback script with no args (latest backup) or with a specific archive name. Confirm when prompted. The emergency snapshot means you can undo a bad rollback too.

Typical failure modes:

| Symptom                            | Likely cause                               |
| ---------------------------------- | ------------------------------------------ |
| `Permission denied (publickey)`    | Secret private key ≠ public key on server  |
| `rsync: No such file or directory` | `DEPLOY_PATH` wrong or parent dir missing  |
| 404 on the app path                | Web server not serving that subdirectory   |
| Lint fails in CI                   | Fix locally, push again — deploy never ran |
| Homepage redirects into the app    | Catch-all redirect still active            |

## Why this shape (and not “just use a PaaS”)

Platforms like Netlify, Cloudflare Pages, or Vercel are excellent. This setup exists when you already have a VPS, need files next to other sites on the same host, or want full control of paths, Apache/Nginx config, and retention of backups on disk you own.

You trade a bit of setup for:

- No vendor lock-in on the hosting side
- Explicit backups you can `ls` and restore by hand
- The same mental model as classic ops: build artifact in, live tree out

## Recap

1. Deploy-only SSH key → server + GitHub secret
2. Backup / rollback scripts on the host
3. Four secrets: host, user, key, deploy path
4. Workflow: install → lint → build → backup → `rsync`
5. Fix redirects so root and app paths can coexist
6. Push to `main` and stop thinking about FTP

Once it’s green once, publishing is just committing Markdown — which is the whole point.
