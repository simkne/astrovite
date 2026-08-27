import type { ProjectData } from '@/types'

export const projectData: ProjectData = [
  {
    title: 'Web Development',
    projects: [
      {
        text: 'Snorefree',
        description: 'Stop-snoring therapy app — logopedic exercises, DiGA & BSI TR-03161.',
        image: '/imgs/schnarchfrei-logo.svg',
        href: '/projects/schnarchfrei',
      },
      {
        text: 'ZenSoria',
        description: 'Vue + OpenWeather dashboard — live conditions, forecasts, weather management.',
        image: '/imgs/zensoria_thumb.png',
        href: '/projects/zensoria',
      },
      {
        text: 'Feilacher',
        description: 'Artist website redesign — WordPress, custom block theme.',
        image: '/imgs/feilacher-thumb.png',
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
