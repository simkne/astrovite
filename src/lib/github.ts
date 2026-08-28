// Thin GitHub REST client used by the browser-based editor.
//
// The `repo` parameter is kept flexible on purpose: a future private-repo
// split will point this client at a different repo with a token that has
// write access to both. Do not hardcode the repo in callers.

export interface Repo {
  owner: string
  repo: string
  branch: string
}

export const DEFAULT_REPO: Repo = {
  owner: 'simkne',
  repo: 'astrovite',
  branch: 'main',
}

export const NOTES_PATH = 'content/blog/notes'

export const BLOG_PATH = 'content/blog'

export interface GithubFile {
  content: string
  sha: string
}

export interface FileEntry {
  name: string
  path: string
}

const API = 'https://api.github.com'

function apiUrl(repo: Repo, path: string) {
  return `${API}/repos/${repo.owner}/${repo.repo}/contents/${path}`
}

function headers(token: string): HeadersInit {
  return {
    'Accept': 'application/vnd.github+json',
    'Authorization': `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

function decodeContent(data: any): string {
  return typeof data.content === 'string'
    ? atob(data.content.replace(/\n/g, ''))
    : ''
}

export async function getFile(repo: Repo, token: string, path: string): Promise<GithubFile | null> {
  const res = await fetch(apiUrl(repo, path), { headers: headers(token) })
  if (res.status === 404)
    return null
  if (!res.ok)
    throw await apiError(res)
  const data = await res.json()
  return { content: decodeContent(data), sha: data.sha }
}

export async function listFiles(repo: Repo, token: string, path: string): Promise<FileEntry[]> {
  const res = await fetch(apiUrl(repo, path), { headers: headers(token) })
  if (res.status === 404)
    return []
  if (!res.ok)
    throw await apiError(res)
  const data = await res.json()
  if (!Array.isArray(data))
    return []
  return data
    .filter((entry: any) => entry.type === 'file')
    .map((entry: any) => ({ name: entry.name, path: entry.path }))
}

export interface SaveResult {
  exists: boolean
}

export async function saveFile(
  repo: Repo,
  token: string,
  path: string,
  content: string,
  message: string,
  sha?: string,
): Promise<SaveResult> {
  const body: Record<string, any> = {
    message,
    content: btoa(content),
    branch: repo.branch,
  }
  if (sha)
    body.sha = sha

  const res = await fetch(apiUrl(repo, path), {
    method: 'PUT',
    headers: headers(token),
    body: JSON.stringify(body),
  })

  if (res.status === 422)
    return { exists: true }

  if (!res.ok)
    throw await apiError(res)
  return { exists: false }
}

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function isTokenInvalid(err: unknown) {
  return err instanceof ApiError && err.status === 401
}

async function apiError(res: Response) {
  const message = await errorMessage(res)
  return new ApiError(res.status, message)
}

async function errorMessage(res: Response) {
  try {
    const data = await res.json()
    if (typeof data.message === 'string')
      return data.message
  }
  catch {
    // fall through
  }
  return res.statusText || `GitHub API error (${res.status})`
}
