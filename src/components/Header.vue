<script lang="ts" setup>
import { useWindowScroll } from '@vueuse/core'
import { computed, onMounted, ref, unref } from 'vue'
import { isAdmin, logoutAdmin } from '@/lib/auth'
import siteConfig, { BASE_PATH, withBase } from '@/site-config'
import { getLinkTarget, isExternalLink } from '@/utils/link'
import ThemeToggle from './ThemeToggle.vue'

const navLinks = siteConfig.header.navLinks || []

function currentHref() {
  const path = `${location.pathname}/`
  return navLinks
    .map(link => withBase(link.href))
    .filter(href => path.startsWith(href))
    .sort((a, b) => b.length - a.length)[0] ?? ''
}

const activeHref = computed(() => currentHref())

function isActive(link: { href: string }) {
  return withBase(link.href) === activeHref.value
}

function dispatchActivePage() {
  const el = activeHref.value
    ? (document.querySelector(`header nav a[href="${activeHref.value}"]`) as HTMLElement | null)
    : null
  window.dispatchEvent(new CustomEvent('dot:focus', { detail: { el } }))
}

const loggedIn = ref(false)

async function checkAdmin() {
  loggedIn.value = await isAdmin()
}

function logout() {
  logoutAdmin()
  loggedIn.value = false
}

const socialLinks = computed(() => {
  return siteConfig.socialLinks.filter((link: Record<string, any>) => {
    if (link.header && typeof link.header === 'boolean') {
      return link
    }
    else if (link.header && typeof link.header === 'string') {
      link.icon = link.header.includes('i-') ? link.header : link.icon
      return link
    }
    else {
      return false
    }
  })
})

const { y: scroll } = useWindowScroll()

const oldScroll = ref(unref(scroll))

onMounted(() => {
  checkAdmin()
  dispatchActivePage()
  document.addEventListener('astro:page-load', dispatchActivePage)

  const navMask = document.querySelector('.nav-drawer-mask') as HTMLElement

  navMask?.addEventListener('touchmove', (event) => {
    event.preventDefault()
  })

  const headerEl = document.querySelector('#header') as HTMLElement
  if (!headerEl)
    return

  if (document.documentElement.scrollTop > 100)
    headerEl.classList.add('header-bg-blur')

  window.addEventListener('scroll', () => {
    if (scroll.value < 150) {
      headerEl.classList.remove('header-hide')
      return
    }

    if (scroll.value - oldScroll.value > 150) {
      headerEl.classList.add('header-hide')
      oldScroll.value = scroll.value
    }

    if (oldScroll.value - scroll.value > 150) {
      headerEl.classList.remove('header-hide')
      oldScroll.value = scroll.value
    }
  })
})

function toggleNavDrawer() {
  const drawer = document.querySelector('.nav-drawer') as HTMLElement
  const mask = document.querySelector('.nav-drawer-mask') as HTMLElement
  if (!drawer || !mask)
    return
  if (drawer.style.transform === `translateX(0%)`) {
    drawer.style.transform = `translateX(-100%)`
    mask.style.display = `none`
  }
  else {
    drawer.style.transform = `translateX(0%)`
    mask.style.display = `block`
  }
}
</script>

<template>
  <header
    id="header" :class="{ 'header-bg-blur': scroll > 20 }"
    class="!fixed bg-transparent z-899 w-screen h-20 px-6 flex justify-between items-center relative"
  >
    <div class="flex items-center h-full">
      <a :href="BASE_PATH" mr-6 aria-label="Header Logo Image">
        <img width="32" height="32" :src="withBase(siteConfig.header.logo.src)" :alt="siteConfig.header.logo.alt">
      </a>
      <nav class="sm:flex hidden flex-wrap gap-x-6 position-initial flex-row">
        <a
          v-for="link in navLinks" :key="link.text" :aria-label="`${link.text}`" :target="getLinkTarget(link.href)"
          nav-link :class="{ 'nav-active': isActive(link) }"
          :href="isExternalLink(link.href) ? link.href : withBase(link.href)"
        >
          {{ link.text }}
        </a>
      </nav>
      <div sm:hidden h-full flex items-center @click="toggleNavDrawer()">
        <menu i-ri-menu-2-fill />
      </div>
    </div>
    <div class="flex gap-x-6">
      <a nav-link href="https://weltkugl.net/" target="_blank" i-ri-global-line aria-label="weltkugl.net" />

      <a
        v-for="link in socialLinks" :key="link.text" :aria-label="`${link.text}`" :class="link.icon" nav-link
        :target="getLinkTarget(link.href)" :href="link.href"
      />

      <a
        v-if="loggedIn" nav-link aria-label="Log out" title="Log out" href="#login" i-ri-logout-box-r-line
        @click.stop.prevent="logout"
      />
      <a
        v-else nav-link aria-label="Log in" title="Log in" :href="withBase('/login/')" i-ri-login-box-line
      />
      <ThemeToggle />
    </div>
  </header>
  <nav
    class="nav-drawer sm:hidden"
  >
    <i i-ri-menu-2-fill />
    <a
      v-for="link in navLinks" :key="link.text" :aria-label="`${link.text}`" :target="getLinkTarget(link.href)"
      nav-link :href="isExternalLink(link.href) ? link.href : withBase(link.href)" @click="toggleNavDrawer()"
    >
      {{ link.text }}
    </a>
  </nav>
  <div class="nav-drawer-mask" @click="toggleNavDrawer()" />
</template>

<style scoped>
.header-hide {
  transform: translateY(-100%);
  transition: transform 0.4s ease;
}

.nav-active {
  opacity: 1;
  transform: translateY(-1px);
  filter: drop-shadow(0 0 6px var(--hover-glow, rgba(66, 133, 244, 0.5)));
}

.header-bg-blur {
  --at-apply: backdrop-blur-sm;
}

.nav-drawer {
  transform: translateX(-100%);
  --at-apply: box-border fixed h-screen z-999 left-0 top-0 min-w-32vw max-w-50vw bg-main p-6 text-lg flex flex-col gap-5
    transition-all;
}

.nav-drawer-mask {
  display: none;
  --at-apply: transition-all;
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  z-index: 998;
}
</style>
