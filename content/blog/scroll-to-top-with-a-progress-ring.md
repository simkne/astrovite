---
title: "A scroll-to-top button that doubles as a progress bar"
description: "Most scroll-to-top buttons just fade in and wait. This one shows how far down the page you are with an SVG ring — no dependencies, no separate progress bar. Here's how the ring, the appear threshold, and the 'you made it to the bottom' wobble work."
date: 2026-09-24
lang: en
tags: [dev]
duration: 6min
---

Most scroll-to-top buttons are a one-trick pony. You scroll down, a small arrow fades in, you click it, you're back at the top. Useful, but it tells you nothing the rest of the time — it just floats there, waiting.

This site's button does two jobs with one control. It's still a way back to the top, but the button *is* the progress bar: a thin ring around the arrow fills as you scroll, so at a glance you can see how much of the page is behind you.

<!-- IMAGE: Close-up of the button mid-page — ring about 60% filled, arrow in the middle, faint track behind it. -->

## One control, two jobs

The whole thing is one self-contained component (`ScrollToTop.vue`). It depends only on Vue 3 — no icon library, no UnoCSS, no external stylesheet. The arrow is an inline SVG path, the ring is two SVG circles, and the component is a few kilobytes.

The container is a fixed 48px circle pinned to the bottom-right, invisible until you've scrolled past a threshold:

```css
.scroll-top {
  position: fixed;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
}

.scroll-top--visible {
  opacity: 0.85;
  pointer-events: auto;
}
```

That `pointer-events: none` matters. An invisible fixed overlay that still swallows clicks is a classic bug — when the button is hidden, it has to be truly out of the way, not just transparent.

## The ring is just `stroke-dashoffset`

The progress ring is the interesting part, and it's less code than you'd expect. Two circles share the same radius:

- a **track** circle, drawn faintly (`stroke-opacity: 0.18`) so the full circle is visible even at 0%
- a **bar** circle on top of it, with a rounded cap

The trick is `stroke-dasharray` and `stroke-dashoffset`. Set the dash array to the circle's circumference and you get a single dash that spans the whole circle. Then `stroke-dashoffset` slides where that dash begins:

```ts
const circumference = 2 * Math.PI * ringRadius

const dashOffset = computed(() => {
  const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
  const progress = Math.min(1, Math.max(0, scrollY.value / max))
  return circumference.value * (1 - progress)
})
```

At the top, progress is 0, so the offset equals the full circumference and nothing is drawn. At the bottom, the offset is 0 and the ring is complete. In between, it fills proportionally. No clipping paths, no conic gradients, no per-frame layout math — one number changes, and the browser redraws the stroke.

The SVG is rotated -90° so the fill starts at 12 o'clock and sweeps clockwise, which is what everyone expects a progress ring to do:

```css
.scroll-top__ring {
  transform: rotate(-90deg);
}
```

## Getting "how far down" right

The progress denominator is `scrollHeight - innerHeight`, not `scrollHeight`. The last viewport's worth of the page is already on screen when you're at the bottom, so if you divide by the full height the ring never quite reaches 100%. Subtracting the viewport makes "bottom of the page" line up with "full ring."

I also clamp both ends with `Math.min(1, Math.max(0, …))`. On short pages, or during overscroll on mobile, the raw ratio can dip below 0 or climb past 1, and a ring that overshoots its own circumference looks broken.

## A small reward for reaching the bottom

When you actually hit the bottom, the button does a one-shot wobble — a few degrees of rotation with a small scale-up, decaying back to rest:

```css
@keyframes scroll-top-bounce {
  0% {
    transform: rotate(0deg) scale(1);
  }
  12% {
    transform: rotate(calc(var(--stt-wobble) * -1)) scale(1.12);
  }
  24% {
    transform: rotate(var(--stt-wobble)) scale(1.18);
  }
  /* …decaying back to rest… */
  100% {
    transform: rotate(0deg) scale(1);
  }
}
```

It reads as "you made it to the bottom." Because it's driven by a class that gets added when you cross the threshold, it re-triggers every time you reach the bottom again — which is what you want, and also why it has to stay subtle.

The wobble lives inside `@media (prefers-reduced-motion: no-preference)`. If you've asked your OS for reduced motion, you get a still button and none of the bounce.

## The details that make it feel right

- **Passive scroll listeners.** `{ passive: true }` on both `scroll` and `resize`; the handler only writes a ref, so it never blocks scrolling.
- **A threshold you can tune.** `showAfter` (default 300px) is a prop, along with `size`, `wobbleDeg`, `right`, and `bottom`.
- **Smooth scroll, not a jump.** The click handler is `window.scrollTo({ top: 0, behavior: 'smooth' })`.
- **Hidden in print.** A floating button has no business on paper: `@media print { display: none; }`.
- **Respects the resource-light mode.** In this site's ⚡ save-energy mode, the wobble is switched off with `html.save-energy .scroll-top--bottom { animation: none; }` — a static button for a static page. That mode is a small forkable module ([save-energy](https://github.com/simkne/save-energy)); I wrote about the split in the [next post](../beyond-light-and-dark-mode/).

## Drop it in

Because it's self-contained, it's a two-line integration:

```vue
<script setup>
import ScrollToTop from './ScrollToTop.vue'
</script>

<template>
  <ScrollToTop :show-after="300" :size="48" :wobble-deg="7" />
</template>
```

## Lessons in one line each

- **One control can do two jobs.** The button you want is also the feedback you need — no separate progress bar required.
- **`stroke-dashoffset` is a progress ring.** Set the dash array to the circumference, then slide the offset.
- **Subtract the viewport from the scroll height.** Otherwise your "100%" is off by one screen.
- **Clamp the ratio.** Overscroll and short pages will find the edges otherwise.
- **Invisible overlays must not catch clicks.** `pointer-events: none` until the button is visible.
- **Motion is optional.** Wrap the flourish in `prefers-reduced-motion` — and switch it off entirely in a resource-light mode.
