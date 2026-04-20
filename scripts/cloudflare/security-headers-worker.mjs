const REQUIRED_HEADERS = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://*.workers.dev https://api.formspree.com https://formspree.io; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self' https://formspree.io https://api.formspree.com; upgrade-insecure-requests",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=(), usb=(), browsing-topics=()',
};

export default {
  async fetch(request) {
    const upstreamResponse = await fetch(request);
    const headers = new Headers(upstreamResponse.headers);

    for (const [key, value] of Object.entries(REQUIRED_HEADERS)) {
      headers.set(key, value);
    }

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers,
    });
  },
};
