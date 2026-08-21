<script lang="ts" setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvas = ref<HTMLCanvasElement | null>(null)

interface Particle {
  homeX: number
  homeY: number
  x: number
  y: number
  vx: number
  vy: number
}

const GRID = 24
const DOT_R = 1.2
const GLOW_R = 140
const PULL_R = 150
const ATTRACT = 0.045
const HOME = 0.04
const FRICTION = 0.88
const MAX_V = 6

let ctx: CanvasRenderingContext2D | null = null
let particles: Particle[] = []
let raf = 0
let running = false
let dpr = 1
let width = 0
let height = 0
let color = '#a5aeb8cc'
let litColor = '#4b5563'
const mouse = { x: 0, y: 0, active: false }
const target: { x: number, y: number, active: boolean } = { x: 0, y: 0, active: false }

function readColors() {
  const s = getComputedStyle(document.documentElement)
  color = s.getPropertyValue('--dot-color').trim() || '#a5aeb8cc'
  litColor = s.getPropertyValue('--dot-lit-color').trim() || '#4b5563'
}

function resize() {
  const el = canvas.value
  if (!el)
    return
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  width = el.clientWidth
  height = el.clientHeight
  el.width = Math.floor(width * dpr)
  el.height = Math.floor(height * dpr)
  ctx = el.getContext('2d')
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0)
  particles = []
  for (let y = GRID / 2; y < height; y += GRID) {
    for (let x = GRID / 2; x < width; x += GRID)
      particles.push({ homeX: x, homeY: y, x, y, vx: 0, vy: 0 })
  }
}

function frame() {
  if (!ctx)
    return
  ctx.clearRect(0, 0, width, height)
  for (const p of particles) {
    // Converge toward a hovered link's center
    let ax = 0
    let ay = 0
    if (target.active) {
      const dx = target.x - p.x
      const dy = target.y - p.y
      const dist = Math.hypot(dx, dy)
      if (dist > 0 && dist < PULL_R) {
        ax += (dx / dist) * ATTRACT * (1 - dist / PULL_R)
        ay += (dy / dist) * ATTRACT * (1 - dist / PULL_R)
      }
    }

    // Spring back home
    ax += (p.homeX - p.x) * HOME
    ay += (p.homeY - p.y) * HOME

    p.vx += ax
    p.vy += ay
    const v = Math.hypot(p.vx, p.vy)
    if (v > MAX_V) {
      p.vx = (p.vx / v) * MAX_V
      p.vy = (p.vy / v) * MAX_V
    }
    p.vx *= FRICTION
    p.vy *= FRICTION
    p.x += p.vx
    p.y += p.vy

    // Brighten dots near the cursor ("flashlight" glow) — light only, no pull
    const lit = mouse.active && Math.hypot(mouse.x - p.x, mouse.y - p.y) < GLOW_R
    ctx.fillStyle = lit ? litColor : color
    ctx.fillRect(p.x - DOT_R, p.y - DOT_R, DOT_R * 2, DOT_R * 2)
  }
  raf = requestAnimationFrame(frame)
}

function start() {
  if (running || matchMedia('(prefers-reduced-motion: reduce)').matches)
    return
  running = true
  raf = requestAnimationFrame(frame)
}

function stop() {
  running = false
  if (raf)
    cancelAnimationFrame(raf)
  raf = 0
}

function onPointerMove(e: PointerEvent) {
  mouse.x = e.clientX
  mouse.y = e.clientY
  mouse.active = true
}

function onPointerLeave() {
  mouse.active = false
}

function onPointerOver(e: PointerEvent) {
  const a = (e.target as Element | null)?.closest?.('a')
  if (a) {
    const r = a.getBoundingClientRect()
    target.x = r.left + r.width / 2
    target.y = r.top + r.height / 2
    target.active = true
  }
}

function onPointerOut(e: PointerEvent) {
  const related = e.relatedTarget as Element | null
  if (!related || !related.closest('a'))
    target.active = false
}

let colorObserver: MutationObserver | null = null

onMounted(() => {
  readColors()
  resize()
  window.addEventListener('resize', resize)
  window.addEventListener('pointermove', onPointerMove, { passive: true })
  window.addEventListener('pointerout', onPointerOut)
  window.addEventListener('pointerover', onPointerOver)
  document.documentElement.addEventListener('mouseleave', onPointerLeave)
  start()

  // Re-read colors when the theme (dark/light) class changes
  colorObserver = new MutationObserver(readColors)
  colorObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
})

onBeforeUnmount(() => {
  stop()
  window.removeEventListener('resize', resize)
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerout', onPointerOut)
  window.removeEventListener('pointerover', onPointerOver)
  document.documentElement.removeEventListener('mouseleave', onPointerLeave)
  colorObserver?.disconnect()
})
</script>

<template>
  <canvas ref="canvas" class="dot-bg" aria-hidden="true" />
</template>

<style scoped>
.dot-bg {
  --at-apply: fixed inset-0 block w-full h-full overflow-hidden pointer-events-none;
  z-index: 0;
}
</style>
