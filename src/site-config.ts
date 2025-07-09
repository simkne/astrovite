export const siteConfig = {
  author: 'SimKne',
  title: 'welcome to weltkugl.net',
  subtitle: 'weltkugl.net is a project by SimKne',
  description: 'A collection of some of my projects, and resources I find useful.',
  image: {
    src: 'hero-test.webp',
    alt: 'Website Main Image',
  },
  email: 'noesi.net',
  socialLinks: [
    {
      text: 'GitHub',
      href: 'https://github.com/kieranwv/astro-theme-vitesse',
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
      src: '/favicon.svg',
      alt: 'Logo Image',
    },
    navLinks: [
      {
        text: 'Blog',
        href: '/blog',
      },
      {
        text: 'Notes',
        href: '/blog/notes',
      },
      {
        text: 'Projects',
        href: '/projects',
      },
    ],
  },
  page: {
    blogLinks: [
      {
        text: 'Blog',
        href: '/blog',
      },
      {
        text: 'Notes',
        href: '/blog/notes',
      },
    ],
  },
  footer: {
    navLinks: [
      {
        text: 'Posts Props',
        href: '/posts-props',
      },
      {
        text: 'Markdown Style',
        href: '/md-style',
      },
      {
        text: 'GitHub Repository',
        href: 'https://github.com/simkne/astrovite',
      },
    ],
  },
}

export default siteConfig
