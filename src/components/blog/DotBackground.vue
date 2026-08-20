<script lang="ts" setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const litLayer = ref<HTMLElement | null>(null)

let raf = 0
let glowState: { x: number, y: number, alpha: number, last: number } | null = null

function clearGlow() {
  const el = litLayer.value
  if (!el)
    return
  el.style.opacity = '0'
  el.style.maskImage = 'none'
  el.style.webkitMaskImage = 'none'
}

function paintGlow() {
  const el = litLayer.value
  if (!el || !glowState) {
    clearGlow()
    return
  }
  if (glowState.alpha <= 0.01) {
    clearGlow()
    return
  }
  const alpha = Math.min(glowState.alpha, 1)
  const radius = Number(getComputedStyle(document.documentElement).getPropertyValue('--dot-glow-radius').trim() || 120)
  const mask = `radial-gradient(circle ${radius}px at ${glowState.x}px ${glowState.y}px, rgba(0,0,0,${alpha}) 0%, rgba(0,0,0,${alpha * 0.8}) 25%, rgba(0,0,0,${alpha * 0.4}) 55%, transparent 100%)`
  el.style.opacity = '1'
  el.style.maskImage = mask
  el.style.webkitMaskImage = mask
}

function fadeGlow() {
  if (!glowState) {
    raf = 0
    return
  }
  const fadeMs = Number(getComputedStyle(document.documentElement).getPropertyValue('--dot-glow-fade').trim() || 800)
  const elapsed = performance.now() - glowState.last
  glowState.alpha = 1 - Math.min(elapsed / fadeMs, 1)
  paintGlow()
  if (glowState.alpha > 0.01) {
    raf = requestAnimationFrame(fadeGlow)
    return
  }
  glowState = null
  raf = 0
  clearGlow()
}

function onMove(event: MouseEvent) {
  glowState = {
    x: event.clientX,
    y: event.clientY,
    alpha: 1,
    last: performance.now(),
  }
  if (!raf)
    raf = requestAnimationFrame(fadeGlow)
}

onMounted(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches)
    return
  window.addEventListener('mousemove', onMove, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onMove)
  if (raf)
    cancelAnimationFrame(raf)
})
</script>

<template>
  <div class="dot-bg" aria-hidden="true">
    <div class="dot-bg__layer" />
    <div ref="litLayer" class="dot-bg__layer dot-bg__layer--lit" />
  </div>
</template>

<style scoped>
.dot-bg {
  --at-apply: fixed inset-0 block overflow-hidden pointer-events-none;
  z-index: 0;
}

.dot-bg__layer {
  --at-apply: absolute inset-0;
  background-image: radial-gradient(circle, var(--dot-color) 0.5px, transparent 0.5px);
  background-size: var(--dot-step) var(--dot-step);
  background-position: calc(var(--dot-step) / 2) calc(var(--dot-step) / 2);
}

.dot-bg__layer--lit {
  background-image: radial-gradient(circle, var(--dot-lit-color) 0.5px, transparent 0.5px);
  opacity: 0;
  mask-image: linear-gradient(transparent, transparent);
  -webkit-mask-image: linear-gradient(transparent, transparent);
}

@media (prefers-reduced-motion: reduce) {
  .dot-bg__layer--lit {
    opacity: 0;
  }
}
</style>
