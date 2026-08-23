<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { isAdmin } from '@/lib/auth'

const props = defineProps<{
  path: string
}>()

const admin = ref(false)

onMounted(async () => {
  admin.value = await isAdmin()
})
</script>

<template>
  <div v-if="admin" class="not-prose mt-10 pt-4 border-t border-main !border-op-30">
    <a
      class="inline-flex items-center gap-1.5 text-sm opacity-70 hover:opacity-100 transition-opacity duration-200"
      target="_blank" rel="noopener" :href="`https://github.com/simkne/astrovite/edit/main/${props.path}`"
    >
      <i class="i-ri-edit-line" />
      <span>edit</span>
    </a>
  </div>
</template>
