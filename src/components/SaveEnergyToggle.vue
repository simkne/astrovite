<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue'
import { isMobileDevice } from '@/utils/device'

const STORAGE_KEY = 'astrovite-save-energy'
const isOn = ref(false)

function readStored(): boolean {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'on') {
      return true
    }
    if (v === 'off') {
      return false
    }
  }
  catch (error) {
    void error
  }
  return isMobileDevice()
}

function persist(on: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off')
  }
  catch (error) {
    void error
  }
}

function applyClass(on: boolean, doc: Document = document) {
  doc.documentElement.classList.toggle('save-energy', on)
}

onMounted(() => {
  isOn.value = readStored()
  applyClass(isOn.value)

  watch(isOn, (v) => {
    applyClass(v)
    persist(v)
  })

  document.addEventListener('astro:before-swap', (event) => {
    applyClass(isOn.value, event.newDocument)
  })
})

function toggleSaveEnergy() {
  isOn.value = !isOn.value
}
</script>

<template>
  <button
    aria-label="Save energy"
    :aria-pressed="isOn"
    nav-link
    :class="isOn ? 'i-carbon-flash-filled' : 'i-carbon-flash'"
    @click="toggleSaveEnergy"
  />
</template>
