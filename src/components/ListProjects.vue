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
  <ul grid="~ cols-1 sm:cols-2 gap-4">
    <template v-if="!list || list.length === 0">
      <div py10 opacity-50 text-lg>
        nothing here yet.
      </div>
    </template>
    <li v-for="project in list" :key="project.text" container-link w-full flex items-center rd-2>
      <a
        flex items-center
        :target="getLinkTarget(project.href)"
        :href="isExternalLink(project.href) ? project.href : withBase(project.href)"
        :aria-label="project.text"
      >
        <div ml-2 mr-4 pt-2 flex items-center justify-center>
          <img
            v-if="project.image" width="48" height="48" class="rd-1.5" :src="withBase(project.image)"
            :alt="project.text"
          >
          <i v-else text-4xl inline-block :class="project.icon || 'i-carbon-unknown'" />
        </div>
        <div font-normal lh-tight>
          <div text-lg hover:text-main>{{ project.text }}</div>
          <div opacity-50 text-sm>{{ project.description }}</div>
        </div>
      </a>
    </li>
  </ul>
</template>
