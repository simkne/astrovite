---
title: Markdown Style
---

The page style in your `*.md` file.

> This page shows every style available in markdown. Use it as a reference for how things render.

## Headings

# h1

## h2

### h3

#### h4

##### h5

###### h6

## Text

Paragraphs are separated by a blank line. You can have **bold**, *italic*, ~~strikethrough~~, and `inline code`. Combine them: ***bold and italic***, or use escaped characters like \*this\*.

## Links

This is a [regular link](https://example.com), an [external link](https://schnarchfrei.de) and a [link with title](https://example.com "title text").

## Quotes

> This is a blockquote.
>
> It can span multiple lines and contain **markdown** too.

## Lists

### Unordered

- item one
- item two
  - nested item
    - deeper item
- item three

### Ordered

1. first
2. second
3. third

### Mixed / nested

1. start
   - sub bullet
   - another bullet
2. continue

### Task list

- [x] done task
- [ ] open task

## Code

### Inline code

Use `code` for `strings`, `variable names`, and `commands`.

### Fenced code block

```ts
export const data = {
  name: 'Name',
  value: 'Value',
}

export function getName() {
  return data.name
}
```

### Code block with language highlighting

```js
function greet(name) {
  console.log(`Hello, ${name}!`)
}
```

```python
def greet(name: str) -> str:
    return f"Hello, {name}!"
```

```css
.card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 0.1);
}
```

### Fenced code block with filename (mdx)

```js title="src/utils/posts.ts"
export const posts = []
```

## Tables

| Field        | Description                                          |
| :----------- | :--------------------------------------------------- |
| NAME         | Displayed in header and footer. Used in SEO and RSS. |
| EMAIL        | Displayed in contact section.                        |
| NUM_POSTS    | Limit num of posts on home page.                     |
| NUM_WORKS    | Limit num of works on home page.                     |
| NUM_PROJECTS | Limit num of projects on home page.                  |

## Images

Raster images for heroes and project screenshots live in `src/assets/imgs/` and are optimized at build time
(WebP/AVIF + responsive `srcset`) via Astro’s `<Picture>` / `<Image>` components.

Small logos used from Vue (`Header`) can stay in `public/imgs/` and are referenced with `withBase()`.

Blog frontmatter `image.src` still uses the `imgs/…` path form — the post template resolves it from `src/assets/imgs/`:

```text
---
title: My Post Title
image:
  src: imgs/my-hero-image.jpg
  alt: Short description of the hero image
---
```

For rare inline markdown images that must stay as plain URLs, put a copy under `public/` and use the absolute base path:

```md
![alt text](/www/imgs/example.png)
```

## Horizontal rules

---

## Task / Checkboxes

- [ ] Not done
- [x] Done

## Footnotes

Here is a footnote reference[^1], and another[^2].

[^1]: The first footnote text.
[^2]: The second footnote text.

## Definition of terms

<dl>
  <dt>Term</dt>
  <dd>Definition of the term.</dd>
  <dt>Another term</dt>
  <dd>Another definition.</dd>
</dl>

## Emojis / symbols

- Emoji: :rocket: :sparkles: :white_check_mark:
- Symbols: → · — ©

## HTML

<p class="note">
  Raw HTML is supported, including custom classes and inline elements like <mark>highlighted</mark>.
</p>

---

## MDX support

This site is built to render **both plain Markdown (`.md`) and MDX (`.mdx`)** through the
[`@astrojs/mdx`](https://docs.astro.build/en/guides/integrations-guide/mdx/) integration. MDX is markdown plus the
ability to embed components — but you don't have to use it. A plain `.md` file behaves exactly like markdown; use
`.mdx` when you want richer, component-driven pages.

### What MDX adds over plain markdown

- **JSX / components** — import a Vue or Astro component and use it inline
- **Expressions** — embed JavaScript values with `{ }`
- **Frontmatter + imports** — import utilities and data at the top of the file

### Example: embed a component (mdx)

```mdx
---
title: My MDX page
---

import Counter from '@/components/Counter.vue'

The counter below is a live Vue component:

<Counter client:load />
```

### Example: inline expression (mdx)

```mdx
---
title: Dynamic content
---

Today's date is {new Date().toLocaleDateString()}.

2 + 2 = {2 + 2}
```

### When to use which

| You want to…                          | Use  |
| :------------------------------------ | :--- |
| Write simple formatted content        | `.md` |
| Embed Vue/Astro components or JSX     | `.mdx` |
| Keep it dependency-free and portable  | `.md` |

In practice, the blog posts on this site are written as `.md` — plain markdown covers the vast majority of needs,
and only reach for `.mdx` when a page genuinely needs interactive components.
