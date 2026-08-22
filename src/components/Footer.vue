<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { isAdmin } from '@/lib/auth'
import siteConfig, { withBase } from '@/site-config'
import { getLinkTarget, isExternalLink } from '@/utils/link'

const loggedIn = ref(false)

const navLinks = computed(() => {
  return (siteConfig.footer.navLinks || []).filter(link => !(link.text === 'Editor' && !loggedIn.value))
})

const socialLinks = computed(() => {
  return (siteConfig.socialLinks || []).filter(link => link.href && link.icon)
})

onMounted(async () => {
  loggedIn.value = await isAdmin()
})
</script>

<template>
  <footer class="w-full mt-18 pt-6 pb-8 max-w-3xl text-sm flex flex-col gap-4 border-main border-t !border-op-50 text-dark dark:text-white">
    <div v-if="navLinks.length > 0" class="flex flex-wrap gap-4">
      <template v-for="(link, index) in navLinks" :key="link.text">
        <a
          :aria-label="`${link.text}`" :target="getLinkTarget(link.href)" class="nav-link flex items-center"
          :href="isExternalLink(link.href) ? link.href : withBase(link.href)"
        >
          {{ link.text }}
        </a>
        <span v-if="index < navLinks.length - 1" op-70> / </span>
      </template>
    </div>
    <div class="flex flex-wrap items-center gap-4">
      <a
        v-for="link in socialLinks" :key="link.text" :aria-label="`${link.text}`" nav-link
        :target="getLinkTarget(link.href)" :href="link.href" :class="link.icon"
      />
      <a nav-link :href="`${withBase('/')}rss.xml`" i-ri-rss-line aria-label="RSS" />
    </div>
    <div flex>
      <a nav-link href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank">CC BY-NC-SA 4.0</a>
      <span op-70>&nbsp;&nbsp;&copy;&nbsp;&nbsp;{{ new Date().getFullYear() }}&nbsp;&nbsp;{{ siteConfig.author
      }}.</span>
    </div>
  </footer>
</template>
