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
        icon: 'i-carbon-cloud',
        href: '/projects/zensoria',
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
  {
    title: 'Project Name',
    projects: [],
  },
]
