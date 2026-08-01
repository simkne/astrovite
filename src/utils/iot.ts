import type { CollectionEntry } from 'astro:content'
import { getCollection } from 'astro:content'

export type IotEntry = CollectionEntry<'iot'>

export function sortIotEntries(a: IotEntry, b: IotEntry) {
  const orderA = a.data.order ?? 999
  const orderB = b.data.order ?? 999
  if (orderA !== orderB)
    return orderA - orderB
  return a.data.title.localeCompare(b.data.title)
}

/** All published IoT docs, optionally filtered by section slug (e.g. `esp32`). */
export async function getIotEntries(section?: string) {
  return (await getCollection('iot', (entry) => {
    if (import.meta.env.PROD && entry.data.draft)
      return false
    if (!section)
      return true
    return entry.id === section || entry.id.startsWith(`${section}/`)
  })).sort(sortIotEntries)
}

export async function getIotEntry(slug: string) {
  const entries = await getIotEntries()
  return entries.find(e => e.id === slug)
}
