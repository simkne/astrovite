<script lang="ts" setup>
import { useWindowScroll } from '@vueuse/core'
import { computed, onMounted, ref, unref } from 'vue'
import { isAdmin, logoutAdmin } from '@/lib/auth'
import siteConfig, { BASE_PATH, withBase } from '@/site-config'
import { getLinkTarget, isExternalLink } from '@/utils/link'
import { findActiveHref } from '@/utils/nav'
import ThemeToggle from './ThemeToggle.vue'

const props = defineProps<{
  logoSrc?: string
  logoSrcset?: string
}>()

const navLinks = siteConfig.header.navLinks || []

const resolvedLogoSrc = computed(() => props.logoSrc ?? withBase(siteConfig.header.logo.src))

function getActiveHref() {
  if (typeof location === 'undefined')
    return ''
  const hrefs = navLinks.flatMap(link => [
    link.href,
    ...((link as any).matchPaths ?? []),
  ])
  return findActiveHref(hrefs, location.pathname)
}

function refreshActivePage() {
  const active = getActiveHref()
  document.querySelectorAll('header nav a').forEach((a) => {
    a.classList.toggle('nav-active', a.getAttribute('href') === active)
  })
  dispatchActivePage()
}

function dispatchActivePage() {
  const el = getActiveHref()
    ? (document.querySelector(`header nav a[href="${getActiveHref()}"]`) as HTMLElement | null)
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
  return siteConfig.socialLinks
    .filter((link: Record<string, any>) => !!link.header)
    .map((link: Record<string, any>) => {
      if (typeof link.header === 'string' && link.header.includes('i-'))
        return { ...link, icon: link.header }
      return link
    })
})

const { y: scroll } = useWindowScroll()

const oldScroll = ref(unref(scroll))

onMounted(() => {
  checkAdmin()
  refreshActivePage()
  document.addEventListener('astro:page-load', refreshActivePage)

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
        <img width="32" height="32" :src="resolvedLogoSrc" :srcset="props.logoSrcset || undefined" :alt="siteConfig.header.logo.alt">
      </a>
      <nav class="sm:flex hidden flex-wrap gap-x-6 position-initial flex-row">
        <a
          v-for="link in navLinks" :key="link.text" :aria-label="`${link.text}`" :target="getLinkTarget(link.href)"
          nav-link :href="isExternalLink(link.href) ? link.href : withBase(link.href)"
        >
          {{ link.text }}
        </a>
      </nav>
      <div sm:hidden h-full flex items-center @click="toggleNavDrawer()">
        <menu i-ri-menu-2-fill />
      </div>
    </div>
    <div class="flex gap-x-6">
      <a nav-link :href="withBase('/about/')" i-material-symbols-chat-info-outline text-lg aria-label="About" title="About" />
      <a nav-link href="https://weltkugl.net/" target="_blank" i-streamline-flex-color-earth-1-flat aria-label="weltkugl.net" title="weltkugl.net" />

      <a
        v-for="link in socialLinks" :key="link.text" :aria-label="`${link.text}`" :title="`${link.text}`" :class="link.icon" nav-link
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
  filter: drop-shadow(0 0 6px var(--hover-glow));
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
