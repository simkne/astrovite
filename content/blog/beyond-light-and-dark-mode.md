---
title: "Beyond light and dark: a resource-light reading mode"
description: "Light and dark mode only change colors. This site now has a second, independent switch: a 'save energy' mode that turns off the animations, the blur, and the JavaScript loops, and renders a high-contrast dark page instead. It's packaged as a small, forkable module. Here's the idea, the implementation, and how it differs technically from a plain theme toggle."
date: 2026-09-24
lang: en
tags: [dev, meta]
duration: 9min
draft: true
---

Light and dark mode are usually treated as one decision: which colors do you want? Pick one, invert the palette, done. But there's a second axis almost nobody names — **how much work the page is allowed to do.** Animations, blur, transitions, and JavaScript loops all cost CPU, GPU, and battery, and none of them are things you actually asked for when you clicked "light."

This site now separates the two axes into two controls. The theme toggle picks **color** — light or dark, both with the full experience. A second button, ⚡ **save energy**, picks **cost**: it strips the page of everything that moves or continuously redraws, and renders a high-contrast dark reading view. The two are independent, so all four combinations exist: dark with effects, dark without them, light with, light without.

<!-- IMAGE: The header with both controls — a light/dark toggle and a ⚡ save-energy button side by side. -->

## The pitch: a "save energy" button

Think of it as a **save energy** button sitting next to the theme toggle. Press it and the page stops doing unnecessary work:

- the drifting **aura blobs** are removed entirely
- the **interactive dot grid** becomes a static texture — no `requestAnimationFrame` loop, no pointer listeners
- **frosted-glass** panels become solid backgrounds (no `backdrop-filter`)
- the **page-to-page crossfade** is switched off
- the top **loading bar** is hidden
- link **hover glow and lift** become plain color changes
- the scroll-to-top button loses its [wobble](../scroll-to-top-with-a-progress-ring/)
- the palette switches to **high-contrast dark**: black background, white text, minimal chrome

It's the same site, just calmer and cheaper. Nothing you need is gone; only the things that constantly redraw the screen.

## Why "energy" and "readable" belong together

I don't think this is only an aesthetic preference. There are three reasons it makes sense.

**Energy and battery.** The expensive parts of a page are the parts that run continuously. An animation loop that redraws a canvas sixty times a second, a blurred backdrop that has to be recomposited on every scroll, a crossfade on every navigation — those keep the CPU and GPU awake for as long as the tab is open. A static page lets them idle. That matters on a laptop running on battery, and it matters on phones.

**Readability.** A plain, high-contrast page is simply easier to read. No background motion competing with the text, no translucency softening the contrast. For long-form reading — which is what this site is for — the quiet version is often the better version.

**Accessibility.** The same switch that saves energy also hands a calmer page to people who don't want motion. `prefers-reduced-motion` is the right default signal, but an explicit "plain mode" is a nice escape hatch for everyone else too.

## How it's wired

The state is a single class on `<html>`: `save-energy`, or not. It's independent of the `dark` class, so the two controls never fight. A pre-paint inline script applies it before first render so there's no flash, and the toggle stores your choice in `localStorage`.

Every effect then *opts out* under that class, in one of two ways.

**CSS guards** for anything purely visual:

```css
html.save-energy .aura {
  display: none;
}
html.save-energy #nprogress {
  display: none;
}
html.save-energy::view-transition-old(*),
html.save-energy::view-transition-new(*) {
  animation: none !important;
}
```

**JavaScript guards** for anything with a loop or a listener. Components watch the `<html>` class with a `MutationObserver` and start or stop their work when it changes:

```ts
function syncState() {
  readColors()
  if (isSaveEnergy()) {
    // cancel the frame loop
    stop()
    // remove every pointer listener
    detachInteractions()
    // one static frame, then nothing
    drawStatic()
  }
  else {
    attachInteractions()
    start()
  }
}
```

That first branch is the important detail. It isn't enough to hide a canvas with `display: none` — if the animation loop is still running behind it, you've hidden the work, not stopped it. Turning the mode on has to actually cancel the frame loop and remove the listeners, or you've saved pixels and nothing else.

<!-- IMAGE: Small diagram — html.save-energy → stop() + one static draw; otherwise → start(). -->

## Using the module

The whole thing ships as a small, dependency-free ES module you can drop into any site — it lives at [**simkne/save-energy**](https://github.com/simkne/save-energy) on GitHub. It isn't tied to Astro, Vue, or this theme — the idea is that "save energy" should be something you can add to *your* site in a few minutes.

### Get it

Fork or copy the [`save-energy` repo](https://github.com/simkne/save-energy), or just copy the files into your project. There's no build step: `save-energy.js` is plain ESM and the CSS files are plain CSS.

### Quick start

Add the base stylesheet, the opt-out rules, and (optionally) the high-contrast dark preset:

```html
<link rel="stylesheet" href="save-energy.css" />
<link rel="stylesheet" href="save-energy-dark.css" />
```

Then start it from any script:

```js
import { SaveEnergy } from './save-energy.js'

const energy = new SaveEnergy()
energy.start()
```

`start()` reads the stored preference, applies the `save-energy` class to `<html>`, and wires up the toggle. That's the whole integration for the *behavior*.

To avoid a flash of the wrong mode, drop the generated bootstrap snippet into `<head>` before your stylesheets paint:

```html
<script>/* bootstrapSnippet() output goes here */</script>
```

`bootstrapSnippet()` returns a minified, self-contained one-liner you can paste, so you never hand-write the pre-paint logic.

### Reacting to it

The class does the visual work, but if *your* code owns a loop, you have to stop it too. Subscribe:

```js
const unsubscribe = energy.subscribe((on) => {
  if (on) {
    stopMyAnimationLoop()
  }
  else {
    startMyAnimationLoop()
  }
})
```

There's also a DOM event, so code that isn't part of the module can listen:

```js
window.addEventListener('save-energy:change', (event) => {
  console.log('save energy is', event.detail.on)
})
```

### API

| Member | What it does |
| --- | --- |
| `new SaveEnergy(options)` | Create an instance (it does not start automatically). |
| `start()` / `stop()` | Attach or detach listeners and apply the current state. Idempotent. |
| `isOn()` | The current boolean state. |
| `enable()` / `disable()` / `toggle()` | Change state; persists and notifies. |
| `subscribe(fn)` | Call `fn(on)` on every change; returns an unsubscribe function. |
| `apply(doc)` | Apply the class to a specific document (for example a view transition's `newDocument`). |
| `bootstrapSnippet()` | Returns the inline pre-paint `<script>` string. |
| `readPreference()` | Reads the stored preference, SSR-safe. |

Options are `storageKey`, `className`, `defaultOn`, and `onChange`, defaulting to `'save-energy'`, `'save-energy'`, `false`, and `null`.

### CSS hooks

`save-energy.css` gives you the generic opt-out rules — motion, transitions, `backdrop-filter`, view transitions — all keyed on `html.save-energy`. Two data-attribute hooks let you mark specific elements:

- `data-save-energy="hide"` hides the element in energy mode.
- `data-save-energy="still"` freezes its animation.

`save-energy-dark.css` is an optional preset that adds the high-contrast dark palette (`--se-bg: #000`, `--se-fg: #fff`, a bright link color, an accent) and `color-scheme: dark`. Skip it if you only want the *behavior* and would rather keep your own colors.

### Vue

For Vue 3 there's a composable and a ready-made component:

```js
import { useSaveEnergy } from 'save-energy/vue'

const { isOn, toggle } = useSaveEnergy()
```

`SaveEnergyToggle.vue` is a button that takes `options`, `onLabel`, and `offLabel` props and emits `change`.

### Try it

The repo's [`index.html`](https://github.com/simkne/save-energy/blob/main/index.html) is a self-contained demo — open it directly, no build step. It runs both controls side by side, with a live panel reporting the `<html>` class list and a frame counter that actually stops when energy mode is on.

## How this differs from a plain light/dark switch

This is the part I find genuinely interesting, because the two controls *look* identical from the outside — a button that flips a class — but they're different kinds of things.

**A theme switch is a palette.** Light/dark is pure CSS. You toggle one class and every color rule that already exists re-resolves. There's no lifecycle: nothing starts, nothing stops, nothing to clean up. You could implement it with a single variable swap and no JavaScript at all.

**An energy mode is a contract with your components.** The visual part is still CSS, but the point is the *work*, and the work lives in JavaScript. A canvas animation, a scroll listener, an `IntersectionObserver` — the module can't reach into those and stop them for you. Each effect has to expose a start/stop pair, and something has to call it when the mode changes. That's why the pattern here is a `MutationObserver` on the `<html>` class plus explicit `start()`, `stop()`, `attach()`, and `detach()` methods, rather than just a stylesheet.

**Hiding isn't stopping.** With a theme switch there's nothing running, so "invisible" and "not costing anything" are the same thing. With an energy mode they aren't. `display: none` on an animating canvas still burns a frame loop every 16ms. So the module's core job isn't to *hide* things, it's to make them *stop*: cancel the `requestAnimationFrame`, remove the listeners, release the work.

**It has to be distributable.** A theme toggle is five lines in your own app. An energy mode is only worth anything if it's reusable, because the hard part is the per-component discipline of starting and stopping. So this one is a library with an API (`start`, `stop`, `subscribe`), an event (`save-energy:change`), CSS hooks, and framework adapters — not a snippet.

**It composes with the theme instead of replacing it.** The old design here made light mode *be* the plain mode, which meant you couldn't have a plain dark page or an effect-heavy light one. Now `dark` and `save-energy` are orthogonal classes, so all four combinations come for free — and the energy mode deliberately ships a *dark* high-contrast preset, because on OLED screens dark pixels draw less power.

## The honest caveats

- **Two controls is one control too many for some people.** The clean model is four combinations; the honest cost is a busier header. I think the independence is worth it, but a site with less to switch off might not need the second button.
- **The module can't stop code it doesn't know about.** The CSS hooks and `subscribe()` are the boundary: every animated component still has to cooperate. The library makes that easy, not automatic.
- **"Save energy" is a promise, not a measurement.** Turning off effects reduces work; it doesn't guarantee a specific battery saving. The win is real, but it's a direction rather than a number.

## Make "save energy" a button

The broader idea is the part I'd actually like to see catch on. Every site has a theme toggle now; almost none have an energy toggle. But the things that drain a battery are the same everywhere — autoplaying motion, blurred layers, endless loops.

Imagine a standard, boring, universally understood control: **save energy.** Not a settings maze, just a button next to the theme switch that lets the page stop working so hard. It helps people on low batteries, old phones, and slow connections — and it helps everyone who just wants to read. That's why I packaged this one as a module instead of an in-joke: [fork it](https://github.com/simkne/save-energy), point it at your own effects, and ship the button.

## Lessons in one line each

- **Color and cost are two axes, not one.** A theme toggle answers "which colors?"; an energy toggle answers "how much work?".
- **Hiding isn't stopping.** If a loop is still running behind a hidden element, you've saved nothing.
- **Stop work with a lifecycle, not a stylesheet.** Effects need an explicit start/stop pair and something to call it.
- **Keep the modes orthogonal.** Independent classes (`dark`, `save-energy`) give you all four combinations for free.
- **Ship it as a module.** The hard part is the per-component discipline; make that reusable.
- **Pre-paint the class.** A tiny inline script beats a flash of the wrong mode.
