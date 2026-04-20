const apiServices = [
  {
    id: 'apify-keyword-intel',
    label: 'Apify Keyword Intel',
    owner: 'SEO',
    docs: 'https://apify.com/apify/google-search-scraper',
    requiredEnv: ['APIFY_API_TOKEN'],
    optionalEnv: ['APIFY_KEYWORD_ACTOR_ID', 'APIFY_KEYWORD_COUNTRY', 'APIFY_KEYWORD_LANGUAGE'],
  },
  {
    id: 'google-search-console',
    label: 'Google Search Console API',
    owner: 'SEO',
    docs: 'https://developers.google.com/webmaster-tools',
    requiredEnv: ['GSC_SITE_URL', 'GSC_SERVICE_ACCOUNT_JSON_PATH'],
    optionalEnv: [],
  },
  {
    id: 'bing-webmaster',
    label: 'Bing Webmaster API',
    owner: 'SEO',
    docs: 'https://www.bing.com/webmasters',
    requiredEnv: ['BING_WEBMASTER_API_KEY', 'BING_SITE_URL'],
    optionalEnv: [],
  },
  {
    id: 'cloudflare-wrangler-images',
    label: 'Cloudflare Wrangler Images Hosting',
    owner: 'Platform',
    docs: 'https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/',
    requiredEnv: ['CLOUDFLARE_PAGES_IMAGES_PROJECT'],
    optionalEnv: ['CLOUDFLARE_PAGES_IMAGES_BRANCH', 'PUBLIC_IMAGE_CDN_BASE', 'CLOUDFLARE_API_TOKEN'],
  },
  {
    id: 'cloudflare-cache-purge',
    label: 'Cloudflare Cache Purge API',
    owner: 'Platform',
    docs: 'https://developers.cloudflare.com/api/operations/zone-purge',
    requiredEnv: ['CLOUDFLARE_VELNORA_ZONE_ID', 'CLOUDFLARE_VELNORA_API_TOKEN'],
    optionalEnv: [],
  },
];

const getEnvValue = (key) => {
  const value = process.env[key];
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim();
};

const maskSecret = (value) => {
  if (!value) {
    return '(missing)';
  }

  if (value.length <= 8) {
    return '*'.repeat(value.length);
  }

  return `${value.slice(0, 3)}***${value.slice(-3)}`;
};

const buildServiceSnapshot = (service) => {
  const required = service.requiredEnv.map((key) => ({
    key,
    value: getEnvValue(key),
  }));

  const optional = service.optionalEnv.map((key) => ({
    key,
    value: getEnvValue(key),
  }));

  const missingRequired = required.filter((entry) => !entry.value).map((entry) => entry.key);

  return {
    ...service,
    required,
    optional,
    missingRequired,
    configured: missingRequired.length === 0,
  };
};

const getApiSnapshots = () => apiServices.map((service) => buildServiceSnapshot(service));

export {
  apiServices,
  getEnvValue,
  getApiSnapshots,
  buildServiceSnapshot,
  maskSecret,
};
