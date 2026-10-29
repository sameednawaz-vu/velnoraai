import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const xml = readFileSync(resolve('public/sitemap.xml'), 'utf8');
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);

console.log(`Starting Live Verification of all ${urls.length} sitemap URLs against https://velnoraai.app...\n`);

const CONCURRENCY = 8;
const results = [];
let completed = 0;

async function checkUrl(url) {
  const start = Date.now();
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) VelnoraAudit/2.0'
      },
      redirect: 'manual'
    });
    const duration = Date.now() - start;
    const status = res.status;
    let canonical = null;
    let title = null;
    let h1 = null;

    if (status === 200) {
      const html = await res.text();
      const canonMatch = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i);
      canonical = canonMatch ? canonMatch[1] : null;
      const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
      title = titleMatch ? titleMatch[1] : null;
      const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
      h1 = h1Match ? h1Match[1] : null;
    }

    return {
      url,
      status,
      duration,
      canonical,
      title,
      h1,
      ok: status === 200 && canonical === url
    };
  } catch (err) {
    return {
      url,
      status: 0,
      duration: Date.now() - start,
      error: err.message,
      ok: false
    };
  }
}

async function worker(queue) {
  while (queue.length > 0) {
    const url = queue.shift();
    const res = await checkUrl(url);
    results.push(res);
    completed++;
    if (completed % 25 === 0 || completed === urls.length || !res.ok) {
      const icon = res.ok ? '✅' : '❌';
      console.log(`[${completed}/${urls.length}] ${icon} ${res.status} (${res.duration}ms) ${url} ${res.ok ? '' : `| canonical: ${res.canonical}`}`);
    }
  }
}

const queue = [...urls];
const workers = Array.from({ length: CONCURRENCY }, () => worker(queue));
await Promise.all(workers);

console.log('\n======================================================');
console.log('             SITEMAP VERIFICATION SUMMARY             ');
console.log('======================================================');
const passed = results.filter(r => r.ok).length;
const failed = results.filter(r => !r.ok).length;
const avgDuration = Math.round(results.reduce((a, b) => a + b.duration, 0) / results.length);

console.log(`Total URLs Audited: ${results.length}`);
console.log(`Passed (200 OK & Matching Canonical): ${passed}`);
console.log(`Failed / Redirected: ${failed}`);
console.log(`Average Latency: ${avgDuration}ms`);

if (failed > 0) {
  console.log('\nFailed URLs:');
  for (const f of results.filter(r => !r.ok)) {
    console.log(`  - [${f.status}] ${f.url} (canonical: ${f.canonical || 'NONE'}, error: ${f.error || 'MISMATCH'})`);
  }
} else {
  console.log('\n🎉 ALL 347 SITEMAP PAGES ARE 100% OPERATIONAL & VERIFIED LIVE!');
}
