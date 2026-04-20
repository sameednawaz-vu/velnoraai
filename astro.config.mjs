import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';

export default defineConfig({
  site: 'https://velnoraai.app',
  integrations: [
    preact({ compat: true }),
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
