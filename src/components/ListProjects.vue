<script lang="ts" setup>
import { withBase } from '@/site-config'
import { getLinkTarget, isExternalLink } from '@/utils/link'

defineProps<{
  list: {
    text: string
    description?: string
    icon?: string
    image?: string
    href: string
  }[]
}>()
</script>

<template>
  <ul grid="~ cols-1 sm:cols-2 gap-4" class="not-prose">
    <template v-if="!list || list.length === 0">
      <div py10 opacity-50 text-lg>
        nothing here yet.
      </div>
    </template>
    <li v-for="project in list" :key="project.text" class="not-prose container-link w-full flex items-center rd-2">
      <a
        flex items-center
        class="min-w-0 flex-1"
        style="text-wrap: auto"
        :target="getLinkTarget(project.href)"
        :href="isExternalLink(project.href) ? project.href : withBase(project.href)"
        :aria-label="project.text"
      >
        <div ml-2 mr-4 pt-2 flex items-center justify-center shrink-0>
          <img
            v-if="project.image" width="82" height="82" class="rd-1.5" :src="withBase(project.image)"
            :alt="project.text"
          >
          <i v-else text-6xl inline-block :class="project.icon || 'i-carbon-unknown'" />
        </div>
        <div class="font-normal lh-tight min-w-0">
          <div text-lg hover:text-main>{{ project.text }}</div>
          <div class="opacity-50 text-sm line-clamp-2 overflow-hidden">{{ project.description }}</div>
        </div>
      </a>
    </li>
  </ul>
</template>
