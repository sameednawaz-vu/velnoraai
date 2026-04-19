(() => {
  const SCHEMA_SCRIPT_ID = 'dynamic-jsonld-schema';
  const HISTORY_PATCH_FLAG = '__velnoraSchemaHistoryPatched';
  const ROUTE_EVENT = 'velnora:route-change';
  const MEDIA_PRIVACY_PROMISE =
    'Our secure, client-side converter extracts high-quality 320kbps audio from your MP4 videos. Because we use WebAssembly, your video never leaves your device, making this the most private way to transcode media in 2026.';

  const formatTitle = (value) =>
    String(value || '')
      .replace(/[-_]+/g, ' ')
      .trim()
      .replace(/\b\w/g, (char) => char.toUpperCase());

  const sanitizeText = (value) => String(value || '').replace(/\s+/g, ' ').trim();

  const getMetaContent = (selector) =>
    sanitizeText(document.querySelector(selector)?.getAttribute('content') || '');

  const getCanonicalUrl = () => {
    const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href');
    if (canonical) {
      try {
        return new URL(canonical, window.location.origin).toString();
      } catch {
        return canonical;
      }
    }

    return window.location.href;
  };

  const getPrimaryImage = () => {
    const ogImage = getMetaContent('meta[property="og:image"]');
    if (ogImage) return ogImage;

    const heroImage = document.querySelector('main img, article img, img')?.getAttribute('src');
    if (!heroImage) return '';

    try {
      return new URL(heroImage, window.location.origin).toString();
    } catch {
      return '';
    }
  };

  const buildBreadcrumbSchema = (pathname) => {
    const segments = pathname.split('/').filter(Boolean);
    const items = [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Velnora',
        item: `${window.location.origin}/`,
      },
    ];

    let currentPath = '';
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      items.push({
        '@type': 'ListItem',
        position: index + 2,
        name: formatTitle(segment),
        item: `${window.location.origin}${currentPath}`,
      });
    });

    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items,
    };
  };

  const buildWebPageSchema = (title, description, canonicalUrl, primaryImage) => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: title,
      description,
      url: canonicalUrl,
      inLanguage: 'en',
      isPartOf: {
        '@type': 'WebSite',
        name: 'Velnora',
        url: `${window.location.origin}/`,
      },
    };

    if (primaryImage) {
      schema.primaryImageOfPage = {
        '@type': 'ImageObject',
        contentUrl: primaryImage,
      };
    }

    return schema;
  };

  const buildUtilitySchemas = (pathname, title, description, canonicalUrl) => {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length < 3 || segments[0] !== 'utility') {
      return [];
    }

    const surface = formatTitle(segments[1]);
    const toolSlug = segments[2];
    const toolTitle = sanitizeText(document.querySelector('h1')?.textContent) || formatTitle(toolSlug);

    const softwareSchema = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: toolTitle,
      applicationCategory: 'UtilityApplication',
      applicationSubCategory: `${surface} Tool`,
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      description,
      url: canonicalUrl,
      featureList: [
        'Secure client-side processing',
        'No mandatory account login',
        'Browser-based deterministic workflow',
      ],
    };

    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: `Is ${toolTitle} private and secure?`,
          acceptedAnswer: {
            '@type': 'Answer',
            text: MEDIA_PRIVACY_PROMISE,
          },
        },
        {
          '@type': 'Question',
          name: `Does ${toolTitle} require uploads to a third-party server?`,
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              'No. Velnora utility tools are designed for browser-first execution and privacy-focused processing workflows.',
          },
        },
      ],
    };

    return [softwareSchema, faqSchema];
  };

  const buildSchemas = () => {
    const title = sanitizeText(document.title.replace(/\|\s*Velnora\s*$/i, '')) || 'Velnora';
    const description =
      getMetaContent('meta[name="description"]') ||
      'Velnora provides secure, client-side utility tools for conversion, compression, and workflow execution.';
    const canonicalUrl = getCanonicalUrl();
    const primaryImage = getPrimaryImage();
    const pathname = window.location.pathname;

    const schemas = [
      buildWebPageSchema(title, description, canonicalUrl, primaryImage),
      buildBreadcrumbSchema(pathname),
      ...buildUtilitySchemas(pathname, title, description, canonicalUrl),
    ];

    return schemas;
  };

  const injectSchema = () => {
    const schemas = buildSchemas();
    const scriptNode = document.getElementById(SCHEMA_SCRIPT_ID);
    if (scriptNode) {
      scriptNode.remove();
    }

    const schemaScript = document.createElement('script');
    schemaScript.id = SCHEMA_SCRIPT_ID;
    schemaScript.type = 'application/ld+json';
    schemaScript.textContent = JSON.stringify(schemas);
    document.head.appendChild(schemaScript);
  };

  const scheduleInject = () => {
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => injectSchema());
      return;
    }

    setTimeout(() => injectSchema(), 0);
  };

  const patchHistoryEvents = () => {
    if (window[HISTORY_PATCH_FLAG]) {
      return;
    }

    const notifyRouteChange = () => window.dispatchEvent(new Event(ROUTE_EVENT));
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function pushStateProxy(...args) {
      const result = originalPushState.apply(this, args);
      notifyRouteChange();
      return result;
    };

    history.replaceState = function replaceStateProxy(...args) {
      const result = originalReplaceState.apply(this, args);
      notifyRouteChange();
      return result;
    };

    window[HISTORY_PATCH_FLAG] = true;
  };

  const registerEvents = () => {
    const trigger = () => scheduleInject();

    window.addEventListener('DOMContentLoaded', trigger);
    window.addEventListener('load', trigger);
    window.addEventListener('popstate', trigger);
    window.addEventListener('hashchange', trigger);
    window.addEventListener(ROUTE_EVENT, trigger);
    document.addEventListener('astro:after-swap', trigger);
  };

  patchHistoryEvents();
  registerEvents();
  scheduleInject();
})();
