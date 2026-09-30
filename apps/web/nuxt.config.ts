// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { DEFAULT_PUBLIC_API_BASE } from '@ajkerbazardor/shared';

const uiRoot = fileURLToPath(new URL('../../packages/ui/src', import.meta.url));

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  // SSR enabled for public site
  ssr: true,

  // Dev server on port 3001
  devServer: { port: 3001 },

  // Runtime config — overridden by environment variables at build/runtime
  runtimeConfig: {
    public: {
      apiBase:
        process.env['NUXT_PUBLIC_API_BASE'] ||
        (process.env.NODE_ENV === 'production' ? DEFAULT_PUBLIC_API_BASE : 'http://localhost:3000/api/v1'),
    },
  },

  // Modules
  modules: ['@pinia/nuxt', '@vueuse/nuxt'],

  // CSS — import design tokens directly from ui package source
  css: [join(uiRoot, 'tokens/tokens.css')],

  // Component auto-import from workspace ui package
  // extensions: ['vue'] prevents Nuxt from treating index.ts barrel files as components
  components: [
    { path: '~/components', pathPrefix: false },
    { path: join(uiRoot, 'domain'), prefix: '', extensions: ['vue'] },
    { path: join(uiRoot, 'primitives'), prefix: '', extensions: ['vue'] },
    { path: join(uiRoot, 'charts'), prefix: '', extensions: ['vue'] },
  ],

  // Transpile workspace packages so Vite handles their Vue SFCs
  build: {
    transpile: ['@ajkerbazardor/ui', '@ajkerbazardor/shared'],
  },

  // App head — fonts, meta, SEO
  app: {
    head: {
      htmlAttrs: { lang: 'bn' },
      title: 'আজকের বাজার দর — ঢাকার খুচরা বাজারের দৈনিক দাম',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'ঢাকার বাজারে আজকে কত দামে বিক্রি হচ্ছে চাল, ডাল, তেল, সবজি, মাছ, মাংস? টিসিবির দৈনিক খুচরা মূল্য এক জায়গায়।',
        },
        { name: 'theme-color', content: '#0f766e' },
        { property: 'og:site_name', content: 'আজকের বাজারদর' },
        { property: 'og:locale', content: 'bn_BD' },
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: 'আজকের বাজারদর — ঢাকার দৈনিক বাজারদর' },
        {
          property: 'og:description',
          content: 'ঢাকার পাঁচটি প্রধান বাজারের নিত্যপ্রয়োজনীয় পণ্যের দৈনিক খুচরা দাম — এক জায়গায়।',
        },
        { property: 'og:image', content: 'https://ajkerbazardor.vercel.app/images/hero-bazaar.jpg' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'আজকের বাজারদর — ঢাকার দৈনিক বাজারদর' },
        {
          name: 'twitter:description',
          content: 'ঢাকার পাঁচটি প্রধান বাজারের নিত্যপ্রয়োজনীয় পণ্যের দৈনিক খুচরা দাম — এক জায়গায়।',
        },
        { name: 'twitter:image', content: 'https://ajkerbazardor.vercel.app/images/hero-bazaar.jpg' },
      ],
      link: [
        {
          rel: 'preconnect',
          href: 'https://fonts.googleapis.com',
        },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossorigin: '',
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Anek+Bangla:wght@400;500;600;700&family=Hind+Siliguri:wght@400;500;600&display=swap',
        },
      ],
    },
  },

  // Vite
  vite: {
    optimizeDeps: {
      exclude: ['@ajkerbazardor/shared', '@ajkerbazardor/ui'],
    },
    resolve: {
      alias: {
        '@ajkerbazardor/ui': uiRoot,
        '@ajkerbazardor/shared': fileURLToPath(new URL('../../packages/shared/src/index.ts', import.meta.url)),
      },
    },
  },
});
