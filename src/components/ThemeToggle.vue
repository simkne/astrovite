<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue'

const STORAGE_KEY = 'astrovite-theme'
const isDark = ref(true)

function readStored(): boolean {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'light') {
      return false
    }
  }
  catch (error) {
    void error
  }
  // Default to dark — ignore system preference entirely.
  return true
}

function persist(dark: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light')
  }
  catch (error) {
    void error
  }
}

function applyClass(dark: boolean, doc: Document = document) {
  doc.documentElement.classList.toggle('dark', dark)
}

onMounted(() => {
  isDark.value = readStored()
  applyClass(isDark.value)

  watch(isDark, (v) => {
    applyClass(v)
    persist(v)
  })

  document.addEventListener('astro:before-swap', (event) => {
    applyClass(isDark.value, event.newDocument)
  })
})

function toggleTheme(event: MouseEvent) {
  const x = event.clientX
  const y = event.clientY
  const endRadius = Math.hypot(
    Math.max(x, innerWidth - x),
    Math.max(y, innerHeight - y),
  )

  // Capture direction BEFORE toggling to avoid reactivity timing issues
  const turningDark = !isDark.value

  // No animated transition while save-energy is active — the theme class still
  // toggles, but it has no visible effect until energy saving is turned off.
  if (document.documentElement.classList.contains('save-energy')) {
    isDark.value = turningDark
    return
  }

  // @ts-expect-error: Transition API
  if (!document.startViewTransition) {
    isDark.value = turningDark
    return
  }

  // @ts-expect-error: Transition API
  const transition = document.startViewTransition(async () => {
    isDark.value = turningDark
  })

  transition.ready.then(() => {
    const clipPath = [
      `circle(0px at ${x}px ${y}px)`,
      `circle(${endRadius}px at ${x}px ${y}px)`,
    ]
    document.documentElement.animate(
      {
        clipPath: turningDark ? [...clipPath].reverse() : clipPath,
      },
      {
        duration: 400,
        easing: 'ease-in',
        pseudoElement: turningDark
          ? '::view-transition-old(root)'
          : '::view-transition-new(root)',
      },
    )
  })
}
</script>

<template>
  <button class="theme-toggle" :aria-label="isDark ? 'Dark Theme' : 'Light Theme'" nav-link dark:i-ri-moon-line i-ri-sun-line @click="toggleTheme" />
</template>
