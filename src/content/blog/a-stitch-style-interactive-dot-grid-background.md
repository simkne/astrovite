---
title: "A stitch-style interactive dot grid background"
description: "How I built the dot-grid background on this site — soft cursor glow, dots that bunch together over links, and why the final version is a canvas particle system you can drop into any project."
date: 2026-08-21
lang: en
tags: [dev]
duration: 9min
---

The background you're looking at right now is a fine grid of dots that do two things:

1. Dots **softly brighten** around the cursor, like a flashlight over a field of faint stars.
2. When you hover a **link or button**, nearby dots **bunch tighter together**, then relax back when you move away.

It looks like a small thing, but the journey from "the site already has a dot background" to "interactive particle grid" had a few genuinely interesting dead ends. This post is the write-up — plus a standalone, dependency-free implementation you can add to any page.

## The starting point: a pure CSS dot grid

The theme this site is built on shipped with a dot background (`dot.css`) that is entirely CSS:

```css
.bg-dot::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, var(--dot-bg-color) 22px, transparent 1%) 50%,
    linear-gradient(var(--dot-bg-color) 22px, transparent 1%) 50%,
    var(--dot-color);
  background-size: 24px 24px;
  mask-image: linear-gradient(0deg, transparent 5%, var(--dot-mask-color));
}
```

Two crossed `linear-gradient` layers with a mask produce what looks like a dot grid. It's static, zero JS, GPU-friendly — fine as a decorative baseline.

What I wanted was the treatment from [stitch.withgoogle.com](https://stitch.withgoogle.com/): dots that react to the mouse.

## The detour: asking an LLM about stitch

I asked an LLM how the stitch background works. The confident answer was: *"it's typically built using an HTML5 `<canvas>` with a particle grid, tracking the mouse and scaling dot radius by distance (`Math.hypot`). Here's a CodePen-ready Canvas implementation."*

That's a reasonable particle effect — but it's **not** what stitch actually does. A little digging (there's a faithful recreation by [LivioGama/stitch-bg-effect](https://github.com/LivioGama/stitch-bg-effect)) revealed the real approach:

- **Two CSS `radial-gradient` layers** — one dim base grid, one bright grid
- A `mousemove` handler that updates a **`mask-image: radial-gradient(...)`** on the bright layer, revealing brighter dots only within a radius of the cursor
- A fade driven by `requestAnimationFrame`, so the glow dies down after you stop moving

Note the nuance: **stitch itself is canvas-free.** No particle array, no `ctx.arc()`. The browser's gradient rasterizer does all the work, and JS only tweaks a mask position. That's the classic "ask an AI, then verify against reality" lesson — the model pattern-matched to a generic particle effect instead of the actual site.

So my first shot at this site reproduced stitch **without canvas** — a CSS+mask version. It looked right … until I wanted to make the dots move.

## Where CSS hits a wall: repeating background patterns

The CSS approach treats dots as a **repeating background pattern**, not individual elements. That's why it's cheap. But it also means you can't move one dot without redrawing the whole pattern — you can only reveal/hide the visible layer. Which ruled out the "dots bunch toward the cursor over links" feature.

At that point the honest move was a **canvas particle system**. A grid of particles with home positions, a spring, and a target gives you the convergence for free:

```js
// for each particle:
// 1. attract toward the target (cursor, while over a link/button)
if (target.active) {
  const dist = Math.hypot(target.x - p.x, target.y - p.y)
  if (dist > 0 && dist < pullRadius) {
    ax += (dx / dist) * attract * (1 - dist / pullRadius)
    ay += (dy / dist) * attract * (1 - dist / pullRadius)
  }
}

// 2. spring back to the grid
ax += (p.homeX - p.x) * home
ay += (p.homeY - p.y) * home

// 3. integrate with velocity, clamp max speed, apply damping
p.vx += ax
p.vy += ay
p.vx *= friction
p.vy *= friction
p.x += p.vx
p.y += p.vy
```

Trivial physics, but it's the whole effect. The grid particles have a `homeX/homeY` they spring back to, and an external target they're attracted to while the pointer is over an interactive element. Everything else is tuning constants.

## The bugs worth remembering

A few things broke in ways that initially looked mysterious — all mundane, all punishing:

**1. Minified CSS units broke my parsing.** The first interactive version read tuning values out of CSS custom properties at runtime (`--dot-glow-fade: 800ms;`), then did `Number(...)`. In the production build the CSS minifier rewrote `800ms` as `.8s`. `parseFloat(".8s")` → `0.8` — so the "800ms fade" completed in under a millisecond. The glow appeared and vanished instantly. Lesson: don't parse units out of minified CSS; keep numeric tuning in JS. (This was the CSS+mask version — the same pitfall applies regardless of rendering approach.)

**2. A hard glow cutoff looks like a solid circle.** The first canvas version did `isInRadius ? litColor : baseColor`. The result was a clean-edged disc of brighter dots; the original effect fades. Fix: blend by distance with a **smoothstep** falloff:

```js
const t = 1 - dist / glowRadius
const s = t * t * (3 - 2 * t) // smoothstep
// lerp colorRgb -> litRgb by s
```

Now the glow softens toward its edge instead of ending in a hard line.

**3. Don't let the cursor itself pull dots.** An early version made the *cursor* the attraction target as well as the light source. Result: the entire grid churned and swirled wherever the mouse moved — the calm glow became noise. Fix: keep two separate concepts — **cursor = light only**, and **hovered interactive element = pull only**.

**4. Wide links feel wrong to converge on.** Post titles and cards occupy a full-width `<a>` block, so converging on the link's bounding-box center looked offset from the actual words. Fix: track `pointermove` and keep the convergence focus **under the cursor** while it's over an actionable element, instead of inside the element center.

**5. Buttons are interactive too.** Starting with `closest('a')` missed the theme toggle and the scroll-to-top button. Broaden the selector: `a, button, [role="button"], input, select, textarea`.

## The details that make it feel right

- **devicePixelRatio crispness** — `canvas.width = clientWidth * dpr` + `ctx.setTransform(dpr, ...)`, otherwise the dots look soft and blurry on hi-DPI screens.
- **`prefers-reduced-motion`** — if the user asks for reduced motion, skip the animation loop entirely and draw a static grid. Cheap respect, big accessibility win.
- **Theme awareness** — colors come from `--dot-color` / `--dot-lit-color` CSS variables, with a `MutationObserver` on `<html>`'s `class` attribute so switching dark/light mode updates the dots live without a full reload.
- **`pointer-events: none`** on the canvas — it must never block clicks, text selection, or drags, no matter what z-index it sits at.
- **Content above the canvas** — the background sits at `z-index: 0`; make sure `main`/content is positioned above it (`z-index: 1` or higher).

## Make it yours

Because the core is a single class with no dependencies and only a handful of tunable constants, I extracted it into its own little library:

> **dot-background** — a stitch-style interactive dot grid background
> [github.com/simkne/dot-background](https://github.com/simkne/dot-background)

It includes the vanilla JS module (~4 KB, no build step), optional CSS with dark/light variables, a Vue 3 wrapper, and a build-free demo page (`index.html`). Drop in a `<canvas class="dot-background">`, import the class, call `start()` — that's the whole integration.

```js
import { DotBackground } from './dot-background.js'

const bg = new DotBackground({ canvas: 'canvas.dot-background' })
bg.start()
```

Tune `grid`, `pullRadius`, `attract`, `glowRadius`, colors, and the friction to taste. The demo page in the repo gives you a live instance you can feel before you wire anything up.

## Lessons in one line each

- **Patterns lie.** CSS gradient backgrounds are patterns; particles are elements. Know which one you're really editing.
- **Verify AI answers against the real site.** The "it must be canvas" instinct was exactly wrong for stitch.
- **Minifiers change units.** Never parse CSS custom properties into numbers.
- **Separate light from force.** Brightening and attraction are different jobs with different sources.
- **Hard edges read as bugs.** Use smoothstep whenever "near" means a gradient, not a boolean.
