# Deploy Setup Guide

This guide sets up automatic deployment of your Astro wiki from GitHub to your Netcup server, with backups and rollback capability.

**Goal:** Edit `.md` files on GitHub → push to `main` → site builds and deploys to `https://www.weltkugl.net/www/`

---

## 1. Prerequisites

- Your repo is already on GitHub (`simkne/astrovite` or similar)
- You have SSH access to your Netcup server
- Your server has Node.js installed (for local builds if needed)
- Your domain points to the server and Apache serves from `/var/www/weltkugl.net/`

---

## 2. Generate SSH Key for GitHub Actions

On **your local machine** (Mac/Linux — or Git Bash on Windows):

```bash
ssh-keygen -t ed25519 -a 100 -f ~/.ssh/github_deploy -C "github-actions"
# Press Enter twice (no passphrase needed for CI)
```

This creates two files:
- `~/.ssh/github_deploy` — **private key** (goes into GitHub)
- `~/.ssh/github_deploy.pub` — **public key** (goes on your server)

---

## 3. Add the Public Key to Your Netcup Server

SSH into your Netcup server as the user that owns your web files:

```bash
ssh your-user@your-server-ip
```

Then add the public key:

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
cat >> ~/.ssh/authorized_keys << 'EOF'
# Paste the contents of ~/.ssh/github_deploy.pub here, then save
EOF
chmod 600 ~/.ssh/authorized_keys
```

Or from your **local machine**, use:

```bash
ssh-copy-id -i ~/.ssh/github_deploy.pub your-user@your-server-ip
```

**Test it works:** From your local machine, try:

```bash
ssh -i ~/.ssh/github_deploy your-user@your-server-ip
# Should log in without a password prompt
```

---

## 4. Create Server-Side Scripts

On your Netcup server, create the scripts directory:

```bash
mkdir -p ~/bin
```

### 4.1 Save `~/bin/backup-wiki.sh`

```bash
cat > ~/bin/backup-wiki.sh << 'EOF'
#!/bin/bash
set -e

# Config
WIKI_PATH="/var/www/weltkugl.net/www"
BACKUP_DIR="$HOME/wiki-backups"
RETAIN_DAYS=14

# Ensure backup dir exists
mkdir -p "$BACKUP_DIR"

# Timestamp
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_NAME="wiki-${TIMESTAMP}.tar.gz"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"

# Only backup if wiki dir exists and has content
if [ ! -d "$WIKI_PATH" ] || [ -z "$(ls -A "$WIKI_PATH" 2>/dev/null)" ]; then
    echo "Wiki directory is empty or missing. Skipping backup."
    exit 0
fi

# Create compressed backup
echo "Backing up $WIKI_PATH → $BACKUP_PATH"
tar -czf "$BACKUP_PATH" -C "$(dirname "$WIKI_PATH")" "$(basename "$WIKI_PATH")"

# Show size
ls -lh "$BACKUP_PATH"

# Prune backups older than retain days
echo "Pruning backups older than $RETAIN_DAYS days..."
find "$BACKUP_DIR" -maxdepth 1 -name 'wiki-*.tar.gz' -mtime +$RETAIN_DAYS -delete

# List remaining backups
echo "Current backups:"
ls -lht "$BACKUP_DIR"
EOF
chmod +x ~/bin/backup-wiki.sh
```

### 4.2 Save `~/bin/rollback-wiki.sh`

```bash
cat > ~/bin/rollback-wiki.sh << 'EOF'
#!/bin/bash
set -e

WIKI_PATH="/var/www/weltkugl.net/www"
BACKUP_DIR="$HOME/wiki-backups"

# Show available backups
echo "Available backups:"
ls -lht "$BACKUP_DIR"/wiki-*.tar.gz 2>/dev/null || { echo "No backups found."; exit 1; }

# If no argument provided, use the most recent backup
if [ -z "$1" ]; then
    BACKUP_FILE=$(ls -t "$BACKUP_DIR"/wiki-*.tar.gz 2>/dev/null | head -n 1)
    echo "No backup specified. Using latest: $(basename "$BACKUP_FILE")"
else
    BACKUP_FILE="$BACKUP_DIR/$1"
    if [ ! -f "$BACKUP_FILE" ]; then
        echo "Backup not found: $BACKUP_FILE"
        exit 1
    fi
fi

echo ""
read -p "This will WIPE $WIKI_PATH and restore from $(basename "$BACKUP_FILE"). Continue? [y/N] " confirm
if [[ "$confirm" != [yY] ]]; then
    echo "Aborted."
    exit 0
fi

# Safety backup of current state just in case
if [ -d "$WIKI_PATH" ] && [ -n "$(ls -A "$WIKI_PATH" 2>/dev/null)" ]; then
    EMERGENCY="$BACKUP_DIR/pre-rollback-$(date +%Y%m%d-%H%M%S).tar.gz"
    echo "Creating emergency snapshot → $(basename "$EMERGENCY")"
    tar -czf "$EMERGENCY" -C "$(dirname "$WIKI_PATH")" "$(basename "$WIKI_PATH")"
fi

# Wipe and restore
echo "Restoring..."
rm -rf "$WIKI_PATH"
mkdir -p "$WIKI_PATH"
tar -xzf "$BACKUP_FILE" -C "$(dirname "$WIKI_PATH")" --strip-components=1

echo "Done. Restored from $(basename "$BACKUP_FILE")"
EOF
chmod +x ~/bin/rollback-wiki.sh
```

**Verify the scripts exist:**

```bash
ls -la ~/bin/
```

**If your web root is NOT `/var/www/weltkugl.net/www`**, edit both files now and change `WIKI_PATH` to your actual path.

---

## 5. Update GitHub Secrets

Go to your repo on GitHub → **Settings → Secrets and variables → Actions → New repository secret**

Add these 4 secrets:

| Secret Name | Value | How to get it |
|-------------|-------|---------------|
| `SSH_HOST` | `123.456.789.012` or `www.weltkugl.net` | Your Netcup server IP or domain |
| `SSH_USERNAME` | `simon` or `u12345` | The SSH user you added the key to |
| `SSH_PRIVATE_KEY` | Full private key text | `cat ~/.ssh/github_deploy` on your local machine. Copy everything including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----` |
| `DEPLOY_PATH` | `/var/www/weltkugl.net/www/` | **Absolute path** to the `www/` subfolder. Must end with `/` |

> **Important:** `DEPLOY_PATH` should point to the `www/` subdirectory, not the domain root. Your portal page stays at the domain root.

---

## 6. Fix `.htaccess`

Your current `.htaccess` has this line which breaks the portal page:

```apache
RedirectMatch 301 ^/(.*)$ /www/$1
```

This redirects **everything** including your portal. You must remove or comment out this line so visitors can reach `domain.com/` (portal) separately from `domain.com/www/` (wiki).

Edit `.htaccess` in this repo so it reads:

```apache
# .htaccess generated by InstantIndexer.net .htaccess Generator
# https://instantindexer.net/seo-tools/htaccess-generator

Options +FollowSymLinks -MultiViews
RewriteEngine On
RewriteBase /

# Force WWW
RewriteCond %{HTTP_HOST} ^welkugl\.net$ [NC]
RewriteRule ^(.*)$ https://www.weltkugl.net/$1 [L,R=301]

# Force HTTPS
RewriteCond %{HTTPS} off
RewriteCond %{HTTP_HOST} ^(www\.)?welkugl\.net$ [NC]
RewriteRule ^(.*)$ https://www.weltkugl.net/$1 [L,R=301]

# REMOVED: RedirectMatch 301 ^/(.*)$ /www/$1
# This line is removed because the portal page lives at / and the wiki at /www/

# Block Common Bad Bots & Scrapers (User-Agent based)
RewriteCond %{HTTP_USER_AGENT} (?:AhrefsBot|Baiduspider|BLEXBot|DotBot|MJ12bot|SemrushBot|YandexBot|wget|curl|libwww-perl|python|nikto|scan|java|winhttp|clshttp|loader|email|harvest|extract|grab|miner|httrack) [NC]
RewriteRule ^.* - [F,L]

# Default Directory Index Files
#DirectoryIndex index.php index.html index.htm

# Disable Directory Browsing
Options -Indexes
```

---

## 7. Create the GitHub Actions Workflow

Create/replace `.github/workflows/deploy.yml` in this repo:

```yaml
name: Build and Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Build site
        run: npm run build

      - name: Backup current site on server
        env:
          SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
          SSH_HOST: ${{ secrets.SSH_HOST }}
          SSH_USERNAME: ${{ secrets.SSH_USERNAME }}
        run: |
          mkdir -p ~/.ssh
          echo "$SSH_PRIVATE_KEY" > ~/.ssh/id_deploy
          chmod 600 ~/.ssh/id_deploy
          ssh-keyscan -H "$SSH_HOST" >> ~/.ssh/known_hosts 2>/dev/null || true
          ssh -i ~/.ssh/id_deploy \
              -o StrictHostKeyChecking=accept-new \
              -o BatchMode=yes \
              "$SSH_USERNAME@$SSH_HOST" \
              "bash ~/bin/backup-wiki.sh"

      - name: Deploy to Netcup server
        env:
          SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
          SSH_HOST: ${{ secrets.SSH_HOST }}
          SSH_USERNAME: ${{ secrets.SSH_USERNAME }}
          DEPLOY_PATH: ${{ secrets.DEPLOY_PATH }}
        run: |
          rsync -avz --delete \
            -e "ssh -i ~/.ssh/id_deploy -o StrictHostKeyChecking=accept-new" \
            ./dist/ \
            "${SSH_USERNAME}@${SSH_HOST}:${DEPLOY_PATH}"
```

**Delete the old CI workflow** (`.github/workflows/CI.yml`) — it only lints and is now redundant.

---

## 8. First Test Deploy

### 8.1 Stage and commit everything

```bash
git add .
git commit -m "chore: add deploy workflow, backup scripts, fix .htaccess"
```

### 8.2 Push to main

```bash
git push origin main
```

### 8.3 Watch the action run

Go to GitHub → **Actions** tab. You should see "Build and Deploy" running.

Click into it to watch the logs. The steps should show:
1. ✅ Checkout
2. ✅ Setup Node.js
3. ✅ Install dependencies
4. ✅ Lint
5. ✅ Build site
6. ✅ Backup current site on server
7. ✅ Deploy to Netcup server

### 8.4 Verify on the server

SSH into your server:

```bash
ssh your-user@your-server-ip
ls -la /var/www/weltkugl.net/www/
# Should show index.html, _astro/, posts/, projects/, etc.

ls -la ~/wiki-backups/
# Should show a new tar.gz backup from the deploy
```

### 8.5 Test in browser

- Portal page: `https://www.weltkugl.net/` (should show your portal)
- Wiki: `https://www.weltkugl.net/www/` (should show your Astro wiki)

---

## 9. Make a Content Change to Test the Pipeline

Edit any `.md` file directly on GitHub (or locally and push):

1. Go to GitHub → `src/content/iot/esp32/getting-started.md`
2. Click the pencil icon (Edit)
3. Change one word, scroll down, click **Commit changes...**
4. Select **Commit directly to the `main` branch**
5. Click **Commit changes**

Within ~60 seconds, the Actions tab should show a new run. Once it completes, refresh `https://www.weltkugl.net/www/projects/iot/esp32/getting-started` and your change should be live.

---

## 10. How to Roll Back

If a deploy breaks something, SSH into your Netcup server:

```bash
ssh your-user@your-server-ip

# Roll back to the most recent backup
~/bin/rollback-wiki.sh

# Or specify a specific backup
~/bin/rollback-wiki.sh wiki-20250801-143022.tar.gz
```

The script:
1. Lists available backups
2. Asks for confirmation
3. Creates an emergency snapshot of the current broken state
4. Wipes and restores from the chosen backup

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "Permission denied (publickey)" in Actions | The private key in `SSH_PRIVATE_KEY` secret doesn't match the public key on the server. Re-copy the public key. |
| `rsync` says "No such file or directory" | `DEPLOY_PATH` secret is wrong or the parent directory doesn't exist. Create it manually: `mkdir -p /var/www/weltkugl.net/www/` |
| Site shows 404 at `/www/` | Apache might not serve from that subdir. Check your Apache vhost config allows subdirectories. |
| Backup step says "Wiki directory is empty" | This is normal on the **first** deploy — there's nothing to backup yet. |
| Lint fails in Actions | Fix the lint error locally (`npm run lint:fix`) and push again. |
| Portal page redirects to `/www/` | You forgot to remove the `RedirectMatch` line from `.htaccess`. Fix and push. |

---

## Directory Summary (Server)

After setup, your server should look like this:

```
/var/www/weltkugl.net/
├── index.html                 # ← portal page (you manage this separately)
├── .htaccess                  # ← from this repo (without the redirect)
└── www/                       # ← Astro dist/ deployed here by GitHub Actions
    ├── index.html
    ├── _astro/
    ├── posts/
    ├── projects/
    └── ...

/home/your-user/
├── bin/
│   ├── backup-wiki.sh
│   └── rollback-wiki.sh
└── wiki-backups/
    ├── wiki-20250801-120000.tar.gz
    ├── wiki-20250801-130000.tar.gz
    └── ...
```

---

## Next Steps After Setup

- [ ] Add your portal page files to `/var/www/weltkugl.net/` (not in `www/`)
- [ ] Edit `src/projects/iot-config.ts` to add more wiki sections
- [ ] Replace dummy projects in `src/pages/projects/data.ts` with real ones
- [ ] Clean up old placeholder blog posts in `src/content/blog/`
- [ ] Consider adding a `README.md` to `src/content/` explaining the content structure for future reference
