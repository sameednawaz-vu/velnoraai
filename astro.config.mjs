import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';

export default defineConfig({
  site: 'https://velnoraai.app',
  integrations: [
    preact(),
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
