<script lang="ts" setup>
import { withBase } from '@/site-config'

interface Post {
  id: string
  body?: string
  data: Record<string, any>
  collection: string
}

withDefaults(defineProps<{
  list: Post[]
}>(), {
  list: () => [],
})

function getDate(date: string) {
  return new Date(date).toISOString()
}

function getHref(post: Post) {
  if (post.data.redirect)
    return post.data.redirect
  return withBase(`/posts/${post.id}`)
}

function getTarget(post: Post) {
  if (post.data.redirect)
    return '_blank'
  return '_self'
}

function isSameYear(a: Date | string | number, b: Date | string | number) {
  return a && b && getYear(a) === getYear(b)
}

function getYear(date: Date | string | number) {
  return new Date(date).getFullYear()
}

function getTags(post: Post): string[] {
  return post.data.tags ?? (post.data.tag ? [post.data.tag] : [])
}

function tagHref(tag: string) {
  return withBase(`/blog/tag/${encodeURIComponent(tag)}/`)
}
</script>

<template>
  <ul sm:min-h-38 min-h-28 mb-18>
    <template v-if="!list || list.length === 0">
      <div my-12 opacity-50>
        nothing here yet.
      </div>
    </template>
    <li v-for="(post, index) in list " :key="post.data.title" mb-8>
      <div v-if="!isSameYear(post.data.date, list[index - 1]?.data.date)" select-none relative h18 pointer-events-none>
        <span watermark text-7em op14 top--0.2em>
          {{ getYear(post.data.date) }}
        </span>
      </div>
      <a text-lg lh-tight nav-link flex="~ col gap-2" :aria-label="post.data.title" :target="getTarget(post)" :href="getHref(post)">
        <div flex="~ col md:row gap-2 md:items-center">
          <div flex="~ gap-2 items-center text-wrap">
            <span lh-normal>
              {{ post.data.title }}
            </span>
            <span v-if="post.data.private" class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs card-border opacity-70">
              <i i-ri-lock-line />
              Private
            </span>
            <span v-if="post.data.draft" class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs card-border opacity-70">
              <i i-ri-draft-line />
              Draft
            </span>
          </div>
          <div opacity-50 text-sm ws-nowrap flex="~ gap-2 items-center">
            <i v-if="post.data.redirect" text-base i-ri-external-link-line />
            <i v-if="post.data.recording || post.data.video" text-base i-ri:film-line />
            <time v-if="post.data.date" :datetime="getDate(post.data.date)">{{ post.data.date.split(',')[0] }}</time>
            <span v-if="post.data.duration">· {{ post.data.duration }}</span>
            <span v-if="post.data.lang && post.data.lang.includes('zh')">· 中文</span>
          </div>
          <div v-if="getTags(post).length" flex="~ gap-2 flex-wrap">
            <a
              v-for="tag in getTags(post)" :key="tag" :href="tagHref(tag)" nav-link
              class="inline-flex items-center px-1.5 py-0.5 rounded text-xs card-border opacity-80 hover:opacity-100"
            >
              #{{ tag }}
            </a>
          </div>
        </div>
        <div opacity-50 text-sm>{{ post.data.description }}</div>
      </a>
    </li>
  </ul>
</template>
