/**
 * Utility for generating SEO schemas (JSON-LD) during Astro build.
 */

export interface SchemaOptions {
  title: string;
  description: string;
  url: string;
  image?: string;
  imageAlt?: string;
  publishedDate?: string;
  author?: string;
}

export const buildOrganizationSchema = (origin: string, logoUrl: string) => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${origin}/#organization`,
  name: 'Velnora',
  description: 'Free professional utility tools for conversion, compression, and practical workflows',
  url: origin,
  logo: {
    '@type': 'ImageObject',
    url: logoUrl,
    width: 160,
    height: 160,
    contentUrl: logoUrl,
  },
  founder: {
    '@type': 'Person',
    name: 'Sameed Nawaz',
  },
  sameAs: [
    'https://www.reddit.com/user/Velnoraai/',
    'https://www.facebook.com/profile.php?id=61588840100652',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'Support',
    url: `${origin}/contact`,
  },
});

export const buildWebSiteSchema = (origin: string) => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${origin}/#website`,
  name: 'Velnora',
  url: origin,
  description: 'Free tools workspace for conversion, compression, and practical workflows',
  isPartOf: {
    '@id': `${origin}/#organization`,
  },
  potentialAction: {
    '@type': 'SearchAction',
    target: `${origin}/tools?search={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
});

export const buildBreadcrumbSchema = (origin: string, segments: { name: string; url: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: segments.map((segment, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: segment.name,
    item: segment.url.startsWith('http') ? segment.url : `${origin}${segment.url}`,
  })),
});

export const buildWebPageSchema = (options: SchemaOptions, origin: string) => {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: options.title,
    description: options.description,
    url: options.url,
    inLanguage: 'en',
    isPartOf: {
      '@id': `${origin}/#website`,
    },
  };

  if (options.image) {
    schema.primaryImageOfPage = {
      '@type': 'ImageObject',
      contentUrl: options.image,
      caption: options.imageAlt || options.title,
    };
  }

  return schema;
};

export const buildSoftwareAppSchema = (tool: any, url: string) => ({
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: tool.name,
  description: tool.description,
  applicationCategory: 'UtilityApplication',
  operatingSystem: 'Web',
  url: url,
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  featureList: [
    'Secure client-side processing',
    'Privacy-focused WebAssembly execution',
    'No mandatory account login',
    'Browser-native deterministic workflow',
  ],
});

export const buildFAQSchema = (items: { question: string; answer: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: items.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  })),
});
