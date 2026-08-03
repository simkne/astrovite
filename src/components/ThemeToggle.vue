<script lang="ts" setup>
import { useDark } from '@vueuse/core'
import { onMounted } from 'vue'

const isDark = useDark()

function setDarkMode(document: Document) {
  if (isDark.value)
    document.documentElement.classList.add('dark')
  else
    document.documentElement.classList.remove('dark')
}
onMounted(() => {
  document.addEventListener('astro:before-swap', (event) => {
    setDarkMode(event.newDocument)
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
  <button :aria-label="isDark ? 'Dark Theme' : 'Light Theme'" nav-link dark:i-ri-moon-line i-ri-sun-line @click="toggleTheme" />
</template>
