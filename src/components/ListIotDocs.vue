<script lang="ts" setup>
import { withBase } from '@/site-config'

interface IotDoc {
  id: string
  data: {
    title: string
    description?: string
  }
}

withDefaults(defineProps<{
  list: IotDoc[]
}>(), {
  list: () => [],
})

function getHref(doc: IotDoc) {
  return withBase(`/projects/iot/${doc.id}`)
}
</script>

<template>
  <ul sm:min-h-20 min-h-16 mb-12>
    <template v-if="!list || list.length === 0">
      <div my-8 opacity-50>
        No articles here yet — add a Markdown file under <code>content/iot/</code>.
      </div>
    </template>
    <li v-for="doc in list" :key="doc.id" mb-6>
      <a
        text-lg lh-tight nav-link flex="~ col gap-1"
        :aria-label="doc.data.title"
        :href="getHref(doc)"
      >
        <span>{{ doc.data.title }}</span>
        <span v-if="doc.data.description" opacity-50 text-sm>{{ doc.data.description }}</span>
      </a>
    </li>
  </ul>
</template>
