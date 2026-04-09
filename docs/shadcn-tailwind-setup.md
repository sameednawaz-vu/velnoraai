# shadcn + Tailwind Setup Notes (Astro + Preact)

This repository currently uses:
- TypeScript: enabled
- Component path: `src/components/ui`
- Style strategy: global styles in `src/layouts/BaseLayout.astro` plus component-scoped CSS

It does **not** currently run a full Tailwind pipeline.

## Why keep `src/components/ui`

Using `src/components/ui` keeps shared primitives in one stable place and avoids scattering design-system components across feature folders. It also makes shadcn-style imports predictable in an Astro project structure.

## Optional: Enable Tailwind + shadcn CLI in this repo

1. Install Astro Tailwind integration and Tailwind packages.

```bash
npm install -D @astrojs/tailwind tailwindcss postcss autoprefixer
```

2. Add Tailwind integration in `astro.config.mjs`.

```js
import tailwind from '@astrojs/tailwind';

integrations: [
  preact({ compat: true }),
  tailwind(),
]
```

3. Create Tailwind config.

```bash
npx tailwindcss init -p
```

4. Set content globs in `tailwind.config.*`.

```js
content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}']
```

5. Create `src/styles/tailwind.css`.

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

6. Import `src/styles/tailwind.css` in `src/layouts/BaseLayout.astro`.

7. Add TS path aliases in `tsconfig.json` if you want `@/` style imports.

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

8. Run shadcn CLI once Tailwind and aliases are active.

```bash
npx shadcn@latest init
```
