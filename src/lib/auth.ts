// Client-side "auth" for private content (Level 2, no server).
//
// Security model (documented in README):
// - There is no backend. Everything runs in the browser.
// - The master password is NEVER stored in plaintext. Only its SHA-256 hash
//   lives in this (public) repo as a constant. Hashing in the browser is not
//   real security — anyone can read the hash and brute-force it — but it
//   avoids storing the raw password anywhere.
// - Private note content is present in the page's HTML source; the gate only
//   hides it visually. See README for the caveat.

export const STORAGE_KEYS = {
  admin: 'astrovite_admin',
  githubToken: 'astrovite_gh_token',
} as const

export function sessionStorageKey(slug: string) {
  return `astrovite_unlocked:${slug}`
}

export function githubToken() {
  return localStorage.getItem(STORAGE_KEYS.githubToken) ?? ''
}

export function setGithubToken(token: string) {
  localStorage.setItem(STORAGE_KEYS.githubToken, token)
}

export async function sha256Hex(input: string) {
  const data = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('')
}

// Replace with the SHA-256 hash of your master password.
// Generate with: printf 'your-master-password' | shasum -a 256
export const MASTER_PASSWORD_HASH = '33fc0c90afdffce520b89330f71a1cabe9fa4f91689a8f4a5898168aadc63ea3'

export async function isAdmin() {
  const stored = localStorage.getItem(STORAGE_KEYS.admin)
  return MASTER_PASSWORD_HASH !== '' && stored === MASTER_PASSWORD_HASH
}

export async function loginMaster(password: string) {
  const hash = await sha256Hex(password)
  if (MASTER_PASSWORD_HASH === '' || hash !== MASTER_PASSWORD_HASH)
    return false
  localStorage.setItem(STORAGE_KEYS.admin, hash)
  return true
}

export function logoutAdmin() {
  localStorage.removeItem(STORAGE_KEYS.admin)
}

export function isUnlockedForSession(slug: string, sharePassword: string) {
  return sessionStorage.getItem(sessionStorageKey(slug)) === sharePassword
}

export function unlockForSession(slug: string, sharePassword: string) {
  sessionStorage.setItem(sessionStorageKey(slug), sharePassword)
}
