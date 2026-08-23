import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetTypography,
  presetUno,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'

export default defineConfig({

  theme: {
    fontFamily: {
      sans: 'Manrope, ui-sans-serif, system-ui, sans-serif',
      mono: '"DM Mono", ui-monospace, monospace',
    },
    fontSize: {
      lg: ['1.1rem', '1.45rem', '-0.025em'], // [font-size, line-height]
    },
  },
  shortcuts: [
    {
      'bg-main': 'bg-hex-eef5fc dark:bg-hex-0d1117',
      'text-main': 'text-hex-555555 dark:text-hex-bbbbbb',
      'text-link': 'text-dark dark:text-white ',
      'border-main': 'border-truegray-300 dark:border-truegray-600',
    },
    {
      'text-title': 'text-link text-4xl font-800',
      'home-title': 'text-link text-8xl font-800',
      'nav-link': 'text-link opacity-70 hover:opacity-100 transition-all duration-200 cursor-pointer',
      'prose-link': 'text-link text-nowrap cursor-pointer border-b-1 !border-opacity-30 hover:!border-opacity-100 border-neutral-500 hover:border-truegray-600 dark:border-neutral-500 hover:dark:border-truegray-400 transition-all duration-200 decoration-none',
      'container-link': 'p-2 opacity-60 hover:opacity-100 cursor-pointer hover:bg-truegray-500 !bg-opacity-10 transition-all duration-200',
    },
    {
      'card-border': 'border-main border !border-op-50',
      'input-main': 'border-main border bg-main text-main',
      'btn-main': 'nav-link px-4 py-2 rounded card-border',
      'watermark': 'select-none pointer-events-none color-transparent font-bold text-stroke-2 text-stroke-hex-aaa absolute',
    },
    {
      'hr-line': 'w-14 mx-auto my-8 border-solid border-1px !border-truegray-200 !dark:border-truegray-800',
    },
  ],
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
      prefix: 'i-',
      extraProperties: {
        display: 'inline-block',
      },
    }),
    presetTypography({
      cssExtend: {
        'max-width': '74ch',
      },
    }),
  ],
  transformers: [transformerDirectives(), transformerVariantGroup()],
  safelist: [
    'i-simple-icons-github',
    'i-ri-github-line',
    'i-carbon-chip',
  ],
})
