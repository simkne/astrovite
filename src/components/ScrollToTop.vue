<!--
  ScrollToTop.vue — standalone scroll-to-top button with a scroll-progress ring.

  Self-contained: depends only on Vue 3 (no UnoCSS, no icon/lib dependencies).

  Usage:
    <script setup>
    import ScrollToTop from './ScrollToTop.vue'
    </script>
    <template>
      <ScrollToTop />
    </template>

  Props (all optional):
    showAfter — px scrolled before the button appears (default: 300)
    size      — button diameter in px (default: 48)
    wobbleDeg — amplitude of the attention wobble in degrees (default: 7)
    right     — fixed offset from the right edge (CSS string, default: 1.25rem)
    bottom    — fixed offset from the bottom edge (CSS string, default: 7.5rem)
-->
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    showAfter?: number
    size?: number
    wobbleDeg?: number
    right?: string
    bottom?: string
  }>(),
  {
    showAfter: 300,
    size: 48,
    wobbleDeg: 7,
    right: '1.25rem',
    bottom: '7.5rem',
  },
)

const scrollY = ref(0)
const half = computed(() => props.size / 2)

// keep the ring as a clean circle inset from the button edge
const ringRadius = computed(() => Math.max(6, props.size / 2 - 5))
const circumference = computed(() => 2 * Math.PI * ringRadius.value)

const isVisible = computed(() => scrollY.value > props.showAfter)

const isAtBottom = computed(() => {
  if (typeof document === 'undefined')
    return false
  const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
  return scrollY.value >= max - 4
})

const dashOffset = computed(() => {
  if (typeof document === 'undefined')
    return circumference.value
  const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
  const progress = Math.min(1, Math.max(0, scrollY.value / max))
  return circumference.value * (1 - progress)
})

function onScroll() {
  scrollY.value = window.scrollY
}

function toTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
})
</script>

<template>
  <div
    class="scroll-top"
    :class="{ 'scroll-top--visible': isVisible, 'scroll-top--bottom': isAtBottom }"
    :style="{
      '--stt-size': `${size}px`,
      '--stt-wobble': `${wobbleDeg}deg`,
      right,
      bottom,
    }"
    role="presentation"
  >
    <svg class="scroll-top__ring" :viewBox="`0 0 ${size} ${size}`" aria-hidden="true">
      <circle class="scroll-top__track" :cx="half" :cy="half" :r="ringRadius" />
      <circle
        class="scroll-top__bar"
        :cx="half"
        :cy="half"
        :r="ringRadius"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
      />
    </svg>
    <button class="scroll-top__btn" type="button" aria-label="Scroll to top" @click="toTop">
      <svg class="scroll-top__icon" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 19V5M6 11l6-6 6 6"
          fill="none"
          stroke="currentColor"
          stroke-width="2.4"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.scroll-top {
  --stt-size: 48px;
  --stt-wobble: 7deg;
  position: fixed;
  z-index: 1000;
  width: var(--stt-size);
  height: var(--stt-size);
  border-radius: 50%;
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
}

.scroll-top--visible {
  opacity: 0.85;
  pointer-events: auto;
}

.scroll-top__ring {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.scroll-top__track {
  fill: none;
  stroke: currentColor;
  stroke-width: 3;
  stroke-opacity: 0.18;
}

.scroll-top__bar {
  fill: none;
  stroke: currentColor;
  stroke-width: 3;
  stroke-linecap: round;
}

.scroll-top__btn {
  position: absolute;
  inset: 0;
  border: 0;
  border-radius: 50%;
  background: rgb(136 136 136 / 0.22);
  color: inherit;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: background 0.2s ease;
}

.scroll-top__btn:hover {
  background: rgb(136 136 136 / 0.4);
}

.scroll-top__icon {
  width: 54%;
  height: 54%;
  color: inherit;
}

/* one-shot wobble + scale when the page bottom is reached — reads as "you made
   it to the bottom". Re-triggers each time the bottom is reached again. */
@media (prefers-reduced-motion: no-preference) {
  .scroll-top--bottom {
    animation: scroll-top-bounce 0.9s ease-out;
  }
}

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
  36% {
    transform: rotate(calc(var(--stt-wobble) * -0.8)) scale(1.12);
  }
  52% {
    transform: rotate(calc(var(--stt-wobble) * 0.6)) scale(1.07);
  }
  68% {
    transform: rotate(calc(var(--stt-wobble) * -0.4)) scale(1.03);
  }
  84% {
    transform: rotate(calc(var(--stt-wobble) * 0.2)) scale(1.01);
  }
  100% {
    transform: rotate(0deg) scale(1);
  }
}

@media print {
  .scroll-top {
    display: none;
  }
}
</style>
