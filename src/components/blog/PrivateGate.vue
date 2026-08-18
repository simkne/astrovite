<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { isAdmin, isUnlockedForSession, unlockForSession } from '@/lib/auth'

const props = withDefaults(defineProps<{
  private?: boolean
  sharePassword?: string
  slug: string
}>(), {
  private: false,
  sharePassword: '',
})

const unlocked = ref(false)
const input = ref('')
const error = ref(false)
const copied = ref(false)
const admin = ref(false)

const isPrivate = computed(() => props.private)
const canShare = computed(() => isPrivate.value && !!props.sharePassword)

onMounted(async () => {
  if (!isPrivate.value) {
    unlocked.value = true
    return
  }

  if (await isAdmin()) {
    admin.value = true
    unlocked.value = true
    return
  }

  if (props.sharePassword && isUnlockedForSession(props.slug, props.sharePassword)) {
    unlocked.value = true
    return
  }

  const params = new URLSearchParams(window.location.search)
  const pw = params.get('pw')
  if (props.sharePassword && pw === props.sharePassword) {
    unlockForSession(props.slug, props.sharePassword)
    unlocked.value = true
  }
})

async function tryUnlock() {
  if (!props.sharePassword) {
    error.value = true
    return
  }
  if (input.value === props.sharePassword) {
    unlockForSession(props.slug, props.sharePassword)
    unlocked.value = true
  }
  else {
    error.value = true
  }
}

async function copyShareLink() {
  if (!props.sharePassword)
    return
  const url = `${window.location.origin}${window.location.pathname}?pw=${encodeURIComponent(props.sharePassword)}`
  try {
    await navigator.clipboard.writeText(url)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  }
  catch {
    // clipboard not available — ignore
  }
}
</script>

<template>
  <div>
    <div v-if="isPrivate" class="flex items-center gap-2 mb-4">
      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border-main border !border-op-50 opacity-70">
        <i i-ri-lock-line /> Private
      </span>
      <button v-if="unlocked && canShare" class="nav-link text-sm" type="button" @click="copyShareLink">
        <template v-if="!copied">
          <i i-ri-links-line /> Copy share link
        </template>
        <template v-else>
          <i i-ri-check-line /> Copied
        </template>
      </button>
    </div>

    <div v-show="unlocked">
      <slot />
    </div>

    <div v-if="isPrivate && !unlocked" class="border-main border !border-op-50 rounded p-6 flex flex-col gap-4">
      <div class="flex items-center gap-2 opacity-70">
        <i i-ri-lock-2-line text-xl />
        <span class="font-600">This note is private</span>
      </div>
      <p v-if="!canShare" class="opacity-50 text-sm">
        This note is only visible to the admin. No share password has been set.
      </p>
      <template v-else>
        <p class="opacity-50 text-sm">
          Enter the note's password to read it, or ask the owner for a share link.
        </p>
        <form class="flex flex-col gap-2 sm:flex-row" @submit.prevent="tryUnlock">
          <input
            v-model="input"
            type="password"
            class="px-3 py-2 rounded border-main border bg-main text-main flex-1"
            placeholder="Password"
            autocomplete="off"
          >
          <button class="nav-link px-4 py-2 rounded border-main border !border-op-50" type="submit">
            Unlock
          </button>
        </form>
        <p v-if="error" class="text-red-500 text-sm">
          Wrong password.
        </p>
      </template>
    </div>
  </div>
</template>
