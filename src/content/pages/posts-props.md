---
title: Posts Props
---

Props in blog:

| Field          | Req  | Description                                         |
| :------------- | :--- | :-------------------------------------------------- |
| title          | Yes  | Title of the article.                               |
| description    | Yes  | Description of the article.                         |
| image          | No   | Hero image of the article.                          |
| date           | No   | The publication date of the article.                |
| duration       | No   | The estimated viewing time of the article.          |
| lang           | No   | Article language, default en-US.                    |
| redirect       | No   | The redirected address of the article.              |
| draft          | No   | The current article is in draft status.             |
| tags           | No   | List of tags for the article.                       |
| private        | No   | Hide the article content behind the private gate.   |
| sharePassword  | No   | Share password for private articles.                |
| video          | No   | The article contains a video.                       |

Props in pages:

| Field       | Req  | Description                                          |
| :---------- | :--- | :--------------------------------------------------- |
| title       | Yes  | Title of the article.                      |
| description | Yes  | Description of the article.                |
| image       | No   | Hero image of the article.                 |

## Copy-paste template

All props for a **blog post**, written as YAML frontmatter — copy the block below and paste it at the top of a `.md` file:

```text
---
title: 'My Post Title'
description: 'A short summary of the post.'
image:
  src: imgs/my-hero-image.jpg
  alt: 'Short description of the hero image'
date: 2026-08-22
duration: '5 min'
lang: en
draft: false
private: false
sharePassword: ''
tags: [dev, personal]
redirect: ''
video: false
---

Your content here.
```

Notes:

- Only `title` and `description` are required; everything else is optional.
- `image.src` is relative to `src/assets/imgs/` via the `imgs/…` path form, e.g. `imgs/hero.jpg`.
- `tags` is an array — use `[dev, devops]` or a block list. A single `tag` string also still works as a fallback.
- `private: true` gates the content behind a login or `sharePassword`.
- `draft: true` hides the post from the live site (kept in the repo).
