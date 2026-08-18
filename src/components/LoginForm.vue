<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { isAdmin, loginMaster, logoutAdmin } from '@/lib/auth'

const password = ref('')
const loggedIn = ref(false)
const error = ref(false)

onMounted(async () => {
  loggedIn.value = await isAdmin()
})

async function submit() {
  error.value = false
  if (await loginMaster(password.value)) {
    loggedIn.value = true
    password.value = ''
  }
  else {
    error.value = true
  }
}

function logout() {
  logoutAdmin()
  loggedIn.value = false
}
</script>

<template>
  <div class="flex flex-col gap-4 max-w-md">
    <template v-if="loggedIn">
      <p class="opacity-70">
        You are logged in as admin. All private notes are unlocked.
      </p>
      <button class="nav-link self-start px-4 py-2 rounded border-main border !border-op-50" type="button" @click="logout">
        Log out
      </button>
    </template>
    <template v-else>
      <form class="flex flex-col gap-3" @submit.prevent="submit">
        <input
          v-model="password"
          type="password"
          class="px-3 py-2 rounded border-main border bg-main text-main"
          placeholder="Master password"
          autocomplete="current-password"
        >
        <button class="nav-link self-start px-4 py-2 rounded border-main border !border-op-50" type="submit">
          Log in
        </button>
      </form>
      <p v-if="error" class="text-red-500 text-sm">
        Wrong password.
      </p>
      <p class="opacity-50 text-sm">
        Logging in unlocks every private note on this site for this browser.
      </p>
    </template>
  </div>
</template>
