import { withBase } from '@/site-config'

/**
 * A link in a navigation list.
 *
 * `href` is the link's primary, base-less href (e.g. `/blog/`). It is the
 * value rendered as the `<a>` element's `href` attribute (after `withBase`)
 * and the value reported back as "the active link".
 *
 * `matchPaths` are additional base-less paths that should ALSO count as
 * active for this link (useful when several URL prefixes belong to the same
 * section, e.g. `/blog/` and `/posts/` both belonging to "Blog").
 */
export interface NavItem {
  href: string
  matchPaths?: readonly string[]
}

function normalizePath(path: string): string {
  return path.replace(/\/+/g, '/').replace(/\/$/, '')
}

/**
 * Returns `withBase(href)` of the matching item — i.e. the string to compare
 * directly against an `<a>` element's `href` attribute. The longest matching
 * item wins (so `/blog/notes/` beats `/blog/`). Returns '' if no item matches.
 */
export function findActiveHref(items: readonly NavItem[], currentPath: string): string {
  const current = normalizePath(currentPath)
  const matches = items
    .filter((item) => {
      const candidates = [item.href, ...(item.matchPaths ?? [])]
      return candidates.some((h) => {
        const target = normalizePath(withBase(h))
        return current === target || current.startsWith(`${target}/`)
      })
    })
    .sort((a, b) => b.href.length - a.href.length)
  return matches[0] ? withBase(matches[0].href) : ''
}

/** True if `href` (base-less) is the active link among `items` for `currentPath`. */
export function isActiveHref(href: string, items: readonly NavItem[], currentPath: string): boolean {
  return withBase(href) === findActiveHref(items, currentPath)
}
