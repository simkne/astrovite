import type { CollectionPosts, PostKey } from '@/types'
import { getCollection } from 'astro:content'

export function sortPostsByDate(itemA: CollectionPosts, itemB: CollectionPosts) {
  return new Date(itemB.data.date).getTime() - new Date(itemA.data.date).getTime()
}

export function getTags(post: CollectionPosts): string[] {
  const tags = post.data.tags ?? (post.data.tag ? [post.data.tag] : [])
  return tags.filter(Boolean)
}

export function getAllTags(posts: CollectionPosts[]) {
  const counts = new Map<string, number>()
  for (const post of posts) {
    for (const tag of getTags(post)) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
  }
  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => a.tag.localeCompare(b.tag))
}

export async function getPosts(path?: string, collection: PostKey = 'blog') {
  return (await getCollection(collection, (post) => {
    return (import.meta.env.PROD ? post.data.draft !== true : true) && (path ? post.id.includes(path) : true)
  })).sort(sortPostsByDate)
}
