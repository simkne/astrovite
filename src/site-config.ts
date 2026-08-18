// Always ends with a trailing slash when `base` is set in `astro.config.ts`.
export const BASE_PATH = import.meta.env.BASE_URL || '/'

export function withBase(path: string) {
  const base = BASE_PATH.endsWith('/') ? BASE_PATH : `${BASE_PATH}/`
  const clean = path.replace(/^\/+/, '')
  return `${base}${clean}`
}

export const siteConfig = {
  author: 'SimKne',
  title: 'welcome to weltkugl.net',
  subtitle: 'weltkugl.net is a project by SimKne',
  description: 'A collection of some of my projects, and resources I find useful.',
  image: {
    src: 'imgs/hero01.png',
    alt: 'Website Main Image',
  },
  email: 'noesi.net',
  socialLinks: [
    {
      text: 'GitHub',
      href: 'https://github.com/simkne/astro-vitesse',
      icon: 'i-simple-icons-github',
      header: 'i-ri-github-line',
    },
    {
      text: 'Linkedin',
      href: '',
      icon: 'i-simple-icons-linkedin',
    },
  ],
  header: {
    logo: {
      src: 'imgs/noesi-logo.png',
      alt: 'Logo Image',
    },
    navLinks: [
      {
        text: 'Blog',
        href: '/blog/',
      },
      {
        text: 'Notes',
        href: '/blog/notes/',
      },
      {
        text: 'Projects',
        href: '/projects/',
      },
    ],
  },
  page: {
    blogLinks: [
      {
        text: 'Blog',
        href: '/blog/',
      },
      {
        text: 'Notes',
        href: '/blog/notes/',
      },
    ],
  },
  footer: {
    navLinks: [
      {
        text: 'Posts Props',
        href: '/posts-props/',
      },
      {
        text: 'Markdown Style',
        href: '/md-style/',
      },
      {
        text: 'Editor',
        href: '/editor/',
      },
      {
        text: 'Log in',
        href: '/login/',
      },
      {
        text: 'GitHub Repository',
        href: 'https://github.com/simkne/astrovite',
      },
    ],
  },
}

export default siteConfig
