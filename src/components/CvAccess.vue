<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { isAdmin } from '@/lib/auth'
import siteConfig, { withBase } from '@/site-config'

const loggedIn = ref(false)

onMounted(async () => {
  loggedIn.value = await isAdmin()
})

const cvHref = withBase('/about/cv/')
const emailHref = `mailto:${siteConfig.email}?subject=${encodeURIComponent('Request access to detailed CV')}`
</script>

<template>
  <div class="contact" role="region" aria-label="CV access">
    <h2 class="contact-title">
      <i class="i-ri-file-list-3-line" aria-hidden="true" />
      Detailed CV
    </h2>

    <template v-if="loggedIn">
      <p class="contact-text">
        You're signed in — the full CV with every role, the skills matrix and references is unlocked.
      </p>
      <a class="contact-email" :href="cvHref">
        <i class="i-ri-arrow-right-line" aria-hidden="true" />
        View full CV
      </a>
    </template>

    <template v-else>
      <p class="contact-text">
        Want a more complete version with every role, the skills matrix and references? Send a short note and I'll share the private CV with you.
      </p>
      <a class="contact-email" :href="emailHref">
        <i class="i-ri-mail-line" aria-hidden="true" />
        Request access
      </a>
    </template>
  </div>
</template>
