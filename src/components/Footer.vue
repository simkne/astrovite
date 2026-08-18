<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { isAdmin, logoutAdmin } from '@/lib/auth'
import siteConfig, { withBase } from '@/site-config'
import { getLinkTarget, isExternalLink } from '@/utils/link'

const loggedIn = ref(false)

const navLinks = computed(() => {
  return (siteConfig.footer.navLinks || []).filter(link => !(link.text === 'Editor' && !loggedIn.value))
})

onMounted(async () => {
  loggedIn.value = await isAdmin()
})

function logout() {
  logoutAdmin()
  loggedIn.value = false
}
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
    <div class="flex flex-wrap gap-4">
      <button
        v-if="loggedIn" class="nav-link flex items-center gap-1" type="button" aria-label="Log out" @click="logout"
      >
        <i i-ri-logout-box-r-line />
        Log out
      </button>
      <a
        v-else class="nav-link flex items-center gap-1" aria-label="Log in" :href="withBase('/login/')"
      >
        <i i-ri-login-box-line />
        Log in
      </a>
    </div>
    <div flex>
      <a nav-link href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank">CC BY-NC-SA 4.0</a>
      <span op-70>&nbsp;&nbsp;&copy;&nbsp;&nbsp;{{ new Date().getFullYear() }}&nbsp;&nbsp;{{ siteConfig.author
      }}.</span>
    </div>
  </footer>
</template>
