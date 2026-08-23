<script lang="ts" setup>
import type { FileEntry } from '@/lib/github'
import { marked } from 'marked'
import { computed, onMounted, ref } from 'vue'
import { githubToken, isAdmin, setGithubToken } from '@/lib/auth'
import {
  BLOG_PATH,
  DEFAULT_REPO,

  getFile,
  isTokenInvalid,
  listFiles,
  NOTES_PATH,
  saveFile,
} from '@/lib/github'
import { withBase } from '@/site-config'

interface NoteForm {
  title: string
  description: string
  duration: string
  date: string
  draft: boolean
  private: boolean
  sharePassword: string
  tags: string[]
  body: string
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function emptyForm(): NoteForm {
  return {
    title: '',
    description: '',
    duration: '',
    date: todayISO(),
    draft: false,
    private: false,
    sharePassword: '',
    tags: [],
    body: '',
  }
}

const token = ref('')
const hasToken = computed(() => token.value.trim() !== '')

const admin = ref(false)

const type = ref<'note' | 'post'>('note')
const contentDir = computed(() => type.value === 'note' ? NOTES_PATH : BLOG_PATH)

const notes = ref<FileEntry[]>([])
const loadingNotes = ref(false)
const form = ref<NoteForm>(emptyForm())
const editingPath = ref('')
const loadingNote = ref(false)
const saving = ref(false)
const status = ref('')
const error = ref('')
const view = ref<'edit' | 'preview'>('edit')
const overwrite = ref(false)

const previewHtml = computed(() => marked.parse(form.value.body, { async: false }) as string)

const tagInput = computed({
  get: () => form.value.tags.join(', '),
  set: (value: string) => {
    form.value.tags = value.split(',').map(t => t.trim()).filter(Boolean)
  },
})

onMounted(async () => {
  admin.value = await isAdmin()
  if (!admin.value)
    return
  token.value = githubToken()
  if (hasToken.value)
    loadNotes()
})

function saveToken() {
  setGithubToken(token.value.trim())
  error.value = ''
  status.value = ''
  loadNotes()
}

function clearToken() {
  localStorage.removeItem('astrovite_gh_token')
  token.value = ''
  notes.value = []
  newNote()
}

async function loadNotes() {
  if (!hasToken.value)
    return
  loadingNotes.value = true
  error.value = ''
  try {
    const entries = await listFiles(DEFAULT_REPO, token.value.trim(), contentDir.value)
    notes.value = entries.filter(entry => entry.name.endsWith('.md'))
  }
  catch (e: any) {
    handleError(e, 'Failed to load notes.')
  }
  finally {
    loadingNotes.value = false
  }
}

function setType(next: 'note' | 'post') {
  if (type.value === next)
    return
  type.value = next
  newNote()
  loadNotes()
}

function handleError(e: unknown, fallback: string) {
  if (isTokenInvalid(e)) {
    localStorage.removeItem('astrovite_gh_token')
    token.value = ''
    notes.value = []
    error.value = 'GitHub token expired or invalid — re-enter it to continue.'
    return
  }
  error.value = e instanceof Error ? e.message : fallback
}

function newNote() {
  form.value = emptyForm()
  editingPath.value = ''
  overwrite.value = false
  status.value = ''
  error.value = ''
  view.value = 'edit'
}

async function onSelectNote(event: Event) {
  const select = event.target as HTMLSelectElement
  if (!select.value)
    return
  await loadNote(select.value)
}

async function loadNote(path: string) {
  loadingNote.value = true
  error.value = ''
  status.value = ''
  // Don't keep any previous target: if the load fails, saving must create a
  // new file rather than overwrite an existing one.
  editingPath.value = ''
  try {
    const file = await getFile(DEFAULT_REPO, token.value.trim(), path)
    if (!file) {
      error.value = `Note not found: ${path}`
      return
    }
    const { data, content } = parseFrontmatter(file.content)
    form.value = {
      title: String(data.title ?? ''),
      description: String(data.description ?? ''),
      duration: String(data.duration ?? ''),
      date: formatDate(data.date),
      draft: !!data.draft,
      private: !!data.private,
      sharePassword: String(data.sharePassword ?? ''),
      tags: normalizeTags(data.tags ?? data.tag),
      body: content.trim(),
    }
    editingPath.value = path
    overwrite.value = false
    view.value = 'edit'
    status.value = `Loaded "${path}". Saving will update it.`
  }
  catch (e: any) {
    handleError(e, 'Failed to load note.')
  }
  finally {
    loadingNote.value = false
  }
}

function formatDate(date: any) {
  if (date instanceof Date)
    return date.toISOString().slice(0, 10)
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(date))
    return date.slice(0, 10)
  return todayISO()
}

function slugify(title: string) {
  const slug = title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036F]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || 'untitled'
}

function generateSharePassword() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const bytes = crypto.getRandomValues(new Uint8Array(10))
  form.value.sharePassword = [...bytes].map(b => chars[b % chars.length]).join('')
}

function quote(value: string) {
  return JSON.stringify(value)
}

function normalizeTags(value: unknown): string[] {
  if (Array.isArray(value))
    return value.map(String).filter(Boolean)
  if (typeof value === 'string')
    return value.split(',').map(t => t.trim()).filter(Boolean)
  return []
}

function parseArray(value: string): string[] | undefined {
  if (!value.startsWith('[') || !value.endsWith(']'))
    return undefined
  const inner = value.slice(1, -1).trim()
  if (!inner)
    return []
  return inner
    .split(',')
    .map(v => v.trim())
    .map((v) => {
      if (v.startsWith('"') && v.endsWith('"') && v.length >= 2)
        return v.slice(1, -1)
      return v
    })
    .filter(Boolean)
}

interface ParsedNote {
  data: Record<string, unknown>
  content: string
}

function parseFrontmatter(raw: string): ParsedNote {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw)
  const data: Record<string, unknown> = {}
  if (match) {
    for (const line of match[1].split(/\r?\n/)) {
      const idx = line.indexOf(':')
      if (idx === -1)
        continue
      const key = line.slice(0, idx).trim()
      let value = line.slice(idx + 1).trim()
      const array = parseArray(value)
      if (array) {
        data[key] = array
        continue
      }
      if (value.startsWith('"') && value.endsWith('"') && value.length >= 2)
        value = value.slice(1, -1)
      if (value === 'true')
        data[key] = true
      else if (value === 'false')
        data[key] = false
      else
        data[key] = value
    }
  }
  return { data, content: match ? match[2] : raw }
}

function buildMarkdown() {
  const date = form.value.date || todayISO()
  const lines = [
    '---',
    `title: ${quote(form.value.title)}`,
    `description: ${quote(form.value.description)}`,
    `duration: ${quote(form.value.duration)}`,
    `date: ${date}`,
    `draft: ${form.value.draft}`,
    `private: ${form.value.private}`,
  ]
  if (form.value.private)
    lines.push(`sharePassword: ${quote(form.value.sharePassword)}`)
  if (form.value.tags.length)
    lines.push(`tags: [${form.value.tags.map(quote).join(', ')}]`)
  lines.push('---')
  return `${lines.join('\n')}\n\n${form.value.body.trim()}\n`
}

async function save() {
  if (!hasToken.value) {
    error.value = 'Add your GitHub token first.'
    return
  }
  const path = editingPath.value || `${contentDir.value}/${form.value.date || todayISO()}-${slugify(form.value.title)}.md`
  const action = editingPath.value ? 'Update' : 'Add'
  const label = type.value === 'note' ? 'note' : 'blog post'
  const message = `${action} ${label}: ${form.value.title || 'untitled'}`

  saving.value = true
  error.value = ''
  status.value = ''
  try {
    const existing = await getFile(DEFAULT_REPO, token.value.trim(), path)
    if (existing) {
      if (!editingPath.value && !overwrite.value) {
        overwrite.value = true
        error.value = `"${path}" already exists. Save again to overwrite it.`
        return
      }
      await saveFile(DEFAULT_REPO, token.value.trim(), path, buildMarkdown(), message, existing.sha)
      editingPath.value = path
      status.value = 'Updated — deployed in ~1 min'
      overwrite.value = false
      return
    }
    const result = await saveFile(DEFAULT_REPO, token.value.trim(), path, buildMarkdown(), message)
    if (result.exists) {
      overwrite.value = true
      error.value = `"${path}" already exists. Save again to overwrite it.`
      return
    }
    editingPath.value = path
    status.value = 'Created — deployed in ~1 min'
    overwrite.value = false
  }
  catch (e: any) {
    handleError(e, 'Save failed.')
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div v-if="!admin" class="card-border rounded p-6 flex flex-col gap-4">
      <p class="opacity-70">
        The editor is only available to the admin. <a class="prose-link" :href="withBase('/login/')">Log in</a> to
        continue.
      </p>
    </div>
    <template v-else>
      <!-- Token setup -->
      <div v-if="!hasToken" class="card-border rounded p-6 flex flex-col gap-4">
        <h2 class="text-xl font-700">
          GitHub token
        </h2>
        <p class="opacity-50 text-sm">
          A fine-grained PAT with <code>contents: write</code> on <code>simkne/astrovite</code>. Stored only in this
          browser (<code>localStorage</code>), never sent anywhere but GitHub.
        </p>
        <form class="flex flex-col gap-2 sm:flex-row" @submit.prevent="saveToken">
          <input
            v-model="token" type="password" class="px-3 py-2 rounded input-main flex-1"
            placeholder="github_pat_..." autocomplete="off"
          >
          <button class="btn-main" type="submit">
            Save token
          </button>
        </form>
      </div>

      <!-- Editor -->
      <template v-else>
        <div class="flex gap-2">
          <button
            class="nav-link px-4 py-1.5 rounded card-border text-sm" :class="{ 'opacity-100 !border-op-90': type === 'note', 'opacity-50': type !== 'note' }"
            type="button" @click="setType('note')"
          >
            Note
          </button>
          <button
            class="nav-link px-4 py-1.5 rounded card-border text-sm" :class="{ 'opacity-100 !border-op-90': type === 'post', 'opacity-50': type !== 'post' }"
            type="button" @click="setType('post')"
          >
            Blog post
          </button>
        </div>
        <div class="flex flex-wrap gap-3 items-center">
          <button class="btn-main" type="button" @click="newNote">
            New note
          </button>
          <select
            class="px-3 py-2 rounded input-main max-w-48" aria-label="Existing notes"
            @change="onSelectNote"
          >
            <option value="" disabled selected>
              Edit existing…
            </option>
            <option v-for="note in notes" :key="note.path" :value="note.path">
              {{ note.name }}
            </option>
          </select>
          <span v-if="loadingNotes || loadingNote" class="opacity-50 text-sm">
            loading…
          </span>
          <button class="nav-link text-sm ml-auto" type="button" @click="clearToken">
            Clear token
          </button>
        </div>

        <form class="flex flex-col gap-4" @submit.prevent="save">
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="flex flex-col gap-1">
              <span class="text-sm opacity-60">Title</span>
              <input
                v-model="form.title" type="text" class="px-3 py-2 rounded input-main"
                placeholder="Note title"
              >
            </label>
            <label class="flex flex-col gap-1">
              <span class="text-sm opacity-60">Date</span>
              <input
                v-model="form.date" type="date" class="px-3 py-2 rounded input-main"
              >
            </label>
            <label class="flex flex-col gap-1">
              <span class="text-sm opacity-60">Description</span>
              <input
                v-model="form.description" type="text" class="px-3 py-2 rounded input-main"
                placeholder="Short summary"
              >
            </label>
            <label class="flex flex-col gap-1">
              <span class="text-sm opacity-60">Duration</span>
              <input
                v-model="form.duration" type="text" class="px-3 py-2 rounded input-main"
                placeholder="5 min"
              >
            </label>
            <label class="flex flex-col gap-1 sm:col-span-2">
              <span class="text-sm opacity-60">Tags (comma-separated)</span>
              <input
                v-model="tagInput" type="text" class="px-3 py-2 rounded input-main"
                placeholder="devops, personal, trivial"
              >
            </label>
          </div>

          <div class="flex flex-col gap-2">
            <label class="flex items-center gap-2">
              <input v-model="form.draft" type="checkbox" class="w-5 h-5">
              <span>Draft (not published on the live site)</span>
            </label>
            <label class="flex items-center gap-2">
              <input v-model="form.private" type="checkbox" class="w-5 h-5">
              <span>Private (requires login or share password)</span>
            </label>
            <div v-if="form.private" class="flex flex-col gap-2 border-l border-main !border-op-50 pl-4">
              <label class="flex flex-col gap-1 sm:flex-row sm:items-center">
                <span class="text-sm opacity-60">Share password</span>
                <input
                  v-model="form.sharePassword" type="text" class="px-3 py-2 rounded input-main flex-1"
                  autocomplete="off"
                >
                <button class="nav-link text-sm" type="button" @click="generateSharePassword">
                  Generate
                </button>
              </label>
              <p class="opacity-50 text-sm">
                Private notes are visible to anyone with the link + password. Content is in the page source.
              </p>
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <div class="flex items-center gap-4">
              <span class="text-sm opacity-60">Body</span>
              <button
                class="nav-link text-sm" type="button" :class="{ 'opacity-100': view === 'edit' }" @click="view = 'edit'"
              >
                Edit
              </button>
              <button
                class="nav-link text-sm" type="button" :class="{ 'opacity-100': view === 'preview' }"
                @click="view = 'preview'"
              >
                Preview
              </button>
            </div>
            <!-- speech-to-text button plugs in here later (Web Speech API) -->
            <textarea
              v-if="view === 'edit'" v-model="form.body" rows="16"
              class="px-3 py-2 rounded input-main w-full font-mono"
              placeholder="Write in markdown…"
            />
            <div v-else class="prose" v-html="previewHtml" />
          </div>

          <div class="flex flex-col gap-2">
            <button
              class="nav-link self-start px-6 py-3 rounded card-border text-lg" type="submit"
              :disabled="saving"
            >
              {{ saving ? 'Saving…' : overwrite ? 'Overwrite existing' : 'Save & deploy' }}
            </button>
            <p v-if="status" class="opacity-70 text-sm">
              <i i-ri-check-line /> {{ status }}
            </p>
            <p v-if="error" class="text-red-500 text-sm">
              {{ error }}
            </p>
          </div>
        </form>
      </template>
    </template>
  </div>
</template>
