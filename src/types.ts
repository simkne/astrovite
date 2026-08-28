import type { CollectionEntry } from 'astro:content'

export type IotKey = 'iot'

export type PostKey = 'blog'

export type Pages = 'pages'

export type CollectionIot = CollectionEntry<IotKey>

export type CollectionPosts = CollectionEntry<PostKey>

export type CollectionPages = CollectionEntry<Pages>
