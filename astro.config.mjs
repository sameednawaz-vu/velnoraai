import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
// import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://velnoraai.com',
  integrations: [
    preact(),
    // sitemap({
    //   changefreq: 'weekly',
    //   priority: 0.7,
    //   lastmod: new Date(),
    // }),
  ],
  output: 'static',
  build: {
    format: 'file',
  },
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
    },
  },
});
