import type { CollectionEntry } from 'astro:content'

export type PostKey = 'blog'

export type IotKey = 'iot'

export type CollectionIot = CollectionEntry<IotKey>

export type CollectionPosts = CollectionEntry<PostKey>

export type Pages = 'pages'

export type CollectionPages = CollectionEntry<Pages>

export type ProjectData = Array<{
  title: string
  projects: Array<{
    text: string
    description?: string
    icon?: string
    image?: string
    href: string
  }>
}>
