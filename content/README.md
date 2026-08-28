# content/

Markdown content (the data this site builds from). Phase 1 of content
separation: moved out of `src/content/` so the codebase under `src/` is
purely code. Phase 2 (future) is to split this directory into its own
repository.

## Layout

```
content/
├── blog/        # Blog collection (`blog` in src/content.config.ts)
│   ├── notes/   # Short-form notes (also written via the editor)
│   └── *.md     # Long-form posts
├── iot/         # IoT / home-automation reference docs
│   ├── esp32/
│   ├── openhab/
│   └── sensors/
└── pages/       # Static pages (e.g. md-style.md, posts-props.md)
```

## How it's wired

`src/content.config.ts` declares three collections (`pages`, `blog`, `iot`)
and points each `glob` loader's `base` at the directory above. Schemas and
TypeScript types stay in `src/` because they're code, not data.

The web editor (`src/components/editor/EditorApp.vue` + `src/lib/github.ts`)
writes new notes into `content/blog/notes/` via the GitHub REST API. The
constants `NOTES_PATH` and `BLOG_PATH` in `src/lib/github.ts` are the single
source of truth for those paths.

## Future: content-only repo

This directory is intentionally self-contained so it can be lifted into its
own repo via `git subtree split` or extracted as a submodule. When that
happens:

- `src/content.config.ts` glob `base` paths become repo-relative again
  (`./content/...`), which they already are — no change.
- The GitHub client already accepts a `repo` parameter, so the editor can
  target the content repo independently.
- The content schema (frontmatter rules) lives in `src/content.config.ts`
  and stays with the site code. If schemas also need to move with the
  content, that's a phase-3 discussion.

## Conventions

- One folder per iot section (`esp32/`, `openhab/`, ...). Articles inside a
  section use `<section-slug>/<article-slug>.md` so they render at
  `/projects/iot/<section-slug>/<article-slug>/`.
- Filename slug for new notes: `YYYY-MM-DD-title.md` (set by the editor).
- Frontmatter is validated against the Zod schemas in `src/content.config.ts`.
  Don't add fields that aren't in the schema — the build will warn.
