# Velnora - Free Tools Website

A modern, SEO-optimized Astro website focused on free conversion, compression, utility, and professional workflow tools with strong article support.

## Features

- ✅ **3D Homepage** - Interactive Three.js animations with magnetic effects
- ✅ **Workflow Library** - Reusable templates and guided workflows
- ✅ **Article System** - Tool-linked SEO and GEO article routes
- ✅ **SEO Optimized** - Schema.org markup, sitemap, meta tags
- ✅ **GitHub Pages Ready** - Static generation, automated CI/CD deployment
- ✅ **Contact Form** - Formspree integration with reCAPTCHA v3
- ✅ **Analytics** - Google Analytics 4 integration
- ✅ **Responsive Design** - Mobile-optimized layout
- ✅ **Performance** - Lighthouse optimized, lazy-loaded 3D assets

## Project Structure

```
velnora-website/
├── src/
│   ├── pages/
│   │   ├── index.astro                  # Homepage with 3D hero
│   │   ├── about.astro                  # About page
│   │   ├── learning-hub.astro           # Tool workflow learning guides
│   │   ├── library.astro                # Workflow library overview
│   │   ├── contact.astro                # Contact page
│   │   ├── blog/
│   │   │   ├── index.astro              # Blog listing
│   │   │   └── [slug].astro             # Individual blog posts
│   │   └── prompts/
│   │       └── category/
│   │           └── [slug].astro         # Category pages
│   ├── components/
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   ├── Hero3D.tsx                   # 3D component with Three.js
│   │   ├── PromptCard.astro
│   │   └── ContactForm.astro
│   ├── layouts/
│   │   ├── BaseLayout.astro             # Main layout with SEO & GA4
│   │   └── BlogPost.astro               # Blog post template
│   └── content/
│       └── prompts.json                 # Prompts data
├── public/
├── .github/
│   └── workflows/
│       └── deploy.yml                   # GitHub Actions deployment
├── astro.config.mjs
├── tsconfig.json
└── package.json
```

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

## Configuration

### Environment Setup

Update the following in `src/layouts/BaseLayout.astro`:

```javascript
// Google Analytics ID
const GA_ID = 'G-XXXXXXXXXX';  // Replace with your GA4 ID
```

Update in `src/components/ContactForm.astro`:

```html
<!-- Formspree Form ID -->
<form action="https://formspree.io/f/YOUR_FORM_ID" method="POST">

<!-- reCAPTCHA Site Key -->
<div class="g-recaptcha" data-sitekey="YOUR_RECAPTCHA_SITE_KEY"></div>
```

### Domain Configuration

1. Update `astro.config.mjs`:
```javascript
site: 'https://velnoraai.com'
```

2. GitHub Pages Settings:
   - Repository Settings → Pages
   - Source: Deploy from a branch
   - Branch: main (or your deployment branch)
   - Set custom domain: velnoraai.com

3. Domain DNS (at Namecheap):
   - Option A: Point A records to GitHub Pages IPs:
     - 185.199.108.153
     - 185.199.109.153
     - 185.199.110.153
     - 185.199.111.153
   - Option B: Create CNAME record to username.github.io

## Deployment

### GitHub Pages

The project includes automated deployment via GitHub Actions.

1. Push to `main` branch
2. GitHub Actions builds and deploys automatically
3. Site live at velnoraai.com

**Manual deployment:**
```bash
npm run build
# Push dist/ to gh-pages branch
```

## Content Management

### Adding Blog Posts

Blog posts use dynamic routing. Edit `src/pages/blog/[slug].astro` to add new posts:

```javascript
const posts = [
  {
    slug: 'article-slug',
    title: 'Article Title',
    description: 'Brief description',
    publishedDate: '2026-03-24',
    author: 'Author Name',
    readingTime: 10,
    content: `# Your content here...`
  }
];
```

### Adding Workflow Templates

Update `src/content/prompts.json` to add reusable templates:

```json
{
  "categories": {
    "category-name": {
      "prompts": [
        {
          "title": "Prompt Title",
          "description": "Description",
          "example": "Example use",
          "useCase": "Use case"
        }
      ]
    }
  }
}
```

## SEO Features

- ✅ Schema.org markup (Organization, BlogPosting, FAQPage)
- ✅ Meta tags (title, description, OG tags)
- ✅ Sitemap auto-generation

- ✅ Canonical URLs
- ✅ Structured breadcrumbs
- ✅ Mobile-optimized responsive design

## Performance

**Lighthouse Targets:**
- Mobile: 90+
- Desktop: 95+
- Cumulative Layout Shift: <0.1
- Largest Contentful Paint: <2.5s

**Optimization Techniques:**
- Static generation (zero JavaScript overhead)
- Lazy loading for 3D assets
- Image optimization with sharp
- CSS minification
- Code splitting

## Analytics & Tracking

### Google Analytics 4
- Event tracking for key pages
- Conversion tracking ready
- Search Console integration

### Contact Form
- Formspree backend
- reCAPTCHA v3 spam protection
- Email notifications

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Customization

### Color Theme
Edit CSS variables in `src/layouts/BaseLayout.astro`:

```css
:root {
  --color-primary: #1a1a1a;           /* Main text color */
  --color-secondary: #0d7377;         /* Accent color */
  --color-accent: #14ffec;            /* Highlight color */
  --color-background: #ffffff;        /* Background */
  --color-text: #1a1a1a;              /* Text color */
  --color-border: #e0e0e0;            /* Border color */
}
```

### 3D Hero Animation
Edit `src/components/Hero3D.tsx` to customize:
- Geometry size and type
- Colors and lighting
- Rotation speeds
- Magnetic effect intensity

## Troubleshooting

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules dist
npm install
npm run build
```

### 3D Not Displaying
- Check browser console for errors
- Ensure Three.js is loaded
- Fallback to static image if needed

### Form Not Working
- Verify Formspree form ID
- Test form in browser dev tools
- Check spam folder for test emails

## Weekly Publishing Workflow

To maintain 5 articles per week:

1. **Planning** (Monday)
   - Identify 5 topics
   - Outline key points
   - Gather resources

2. **Content Creation** (Tuesday-Thursday)
   - Write articles
   - Add examples and prompts
   - Optimize for SEO

3. **Review** (Friday)
   - Technical review
   - SEO checklist
   - Schedule publication

4. **Publishing** (Friday/Weekend)
   - Add to blog posts
   - Update blog index
   - Deploy to GitHub Pages

## Performance Monitoring

Monitor key metrics:
- Lighthouse scores
- Google Search Console coverage
- Analytics traffic patterns
- User engagement metrics

## Future Enhancements

- [ ] Prompt download/export features
- [ ] User accounts for saved prompts
- [ ] Advanced analytics dashboard
- [ ] Videos and tutorials
- [ ] Community contributions
- [ ] Mobile app version

## Support & Feedback

For questions, feedback, or contributions, contact us at hello@velnoraai.com

## License

© 2026 Velnora. All rights reserved.

---

**Built with ❤️ using Astro, Preact, and Three.js**
