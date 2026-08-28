import { withBase } from '@/site-config'

function normalizePath(path: string): string {
  return path.replace(/\/+/g, '/').replace(/\/$/, '')
}

/**
 * Given a list of base-less hrefs and the current URL pathname, returns the
 * href that should be marked active — the longest one that exactly matches
 * or is a parent prefix of the current path. Returns '' if none match.
 */
export function findActiveHref(hrefs: readonly string[], currentPath: string): string {
  const current = normalizePath(currentPath)
  const matches = hrefs
    .map(href => normalizePath(withBase(href)))
    .filter(target => current === target || current.startsWith(`${target}/`))
    .sort((a, b) => b.length - a.length)
  return matches[0] ?? ''
}

/** True if `href` (base-less) is the active link in `allHrefs` for `currentPath`. */
export function isActiveHref(href: string, allHrefs: readonly string[], currentPath: string): boolean {
  return findActiveHref(allHrefs, currentPath) === normalizePath(withBase(href))
}
