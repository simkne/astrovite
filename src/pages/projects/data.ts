import type { ImageMetadata } from 'astro'
import type { ProjectData } from '@/types'
import feilacherThumb from '@/assets/imgs/feilacher-thumb.png'
import schnarchfreiLogo from '@/assets/imgs/schnarchfrei-logo.svg'
import zensoriaThumb from '@/assets/imgs/zensoria_thumb.png'

export interface ProjectListItem {
  text: string
  description?: string
  icon?: string
  image?: ImageMetadata
  href: string
}

export type ProjectGroups = Array<{
  title: string
  projects: ProjectListItem[]
}>

export const projectData: ProjectGroups = [
  {
    title: 'Web Development',
    projects: [
      {
        text: 'Snorefree',
        description: 'Stop-snoring therapy app — logopedic exercises, DiGA & BSI TR-03161.',
        image: schnarchfreiLogo,
        href: '/projects/schnarchfrei',
      },
      {
        text: 'ZenSoria',
        description: 'Vue + OpenWeather dashboard — live conditions, forecasts, weather management.',
        image: zensoriaThumb,
        href: '/projects/zensoria',
      },
      {
        text: 'Feilacher',
        description: 'Artist website redesign — WordPress, custom block theme.',
        image: feilacherThumb,
        href: '/projects/feilacher',
      },
    ],
  },
  {
    title: 'IoT',
    projects: [
      {
        text: 'IoT knowledge base',
        description: 'ESP32, openHAB, sensors — notes with section navigation.',
        icon: 'i-carbon-chip',
        href: '/projects/iot',
      },
    ],
  },
]

// Keep legacy type export happy for any remaining string-based consumers.
export type { ProjectData }
