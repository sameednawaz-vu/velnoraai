import puppeteer from 'puppeteer';
import lighthouse from 'lighthouse';

const defaultBaseUrl = process.env.BASE_URL || 'http://localhost:4321';

function getArgValue(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1) {
    return undefined;
  }
  return process.argv[index + 1];
}

function toPercent(score) {
  if (typeof score !== 'number') {
    return 0;
  }
  return Math.round(score * 100);
}

function readThreshold(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) ? value : fallback;
}

function formatMetricValue(value, unit) {
  if (!Number.isFinite(value)) {
    return 'n/a';
  }

  if (unit === 'ms') {
    return `${Math.round(value)} ms`;
  }

  if (unit === 's') {
    return `${(value / 1000).toFixed(2)} s`;
  }

  if (unit === 'bytes') {
    return `${Math.round(value / 1024)} KiB`;
  }

  return `${value}`;
}

function collectOpportunityDiagnostics(lhr) {
  const auditIds = [
    'render-blocking-resources',
    'unused-css-rules',
    'unused-javascript',
    'uses-optimized-images',
    'modern-image-formats',
    'offscreen-images',
    'server-response-time',
    'total-byte-weight',
  ];

  return auditIds
    .map((id) => {
      const audit = lhr.audits?.[id];
      if (!audit) {
        return null;
      }

      const savingsMs = Number(audit.details?.overallSavingsMs || 0);
      const savingsBytes = Number(audit.details?.overallSavingsBytes || 0);
      const score = typeof audit.score === 'number' ? Math.round(audit.score * 100) : null;

      if (savingsMs <= 0 && savingsBytes <= 0) {
        return null;
      }

      return {
        id,
        title: audit.title || id,
        score,
        savingsMs,
        savingsBytes,
      };
    })
    .filter(Boolean)
    .sort((first, second) => {
      if (second.savingsMs !== first.savingsMs) {
        return second.savingsMs - first.savingsMs;
      }
      return second.savingsBytes - first.savingsBytes;
    });
}

function logUnusedJavaScriptDetails(lhr) {
  const unusedAudit = lhr.audits?.['unused-javascript'];
  const items = Array.isArray(unusedAudit?.details?.items) ? unusedAudit.details.items : [];

  if (items.length === 0) {
    return;
  }

  console.log('\n=== Unused JavaScript Detail ===');
  items.slice(0, 8).forEach((item) => {
    const url = item.url || '(inline script)';
    const totalBytes = Number.isFinite(item.totalBytes) ? Math.round(item.totalBytes / 1024) : 0;
    const wastedBytes = Number.isFinite(item.wastedBytes) ? Math.round(item.wastedBytes / 1024) : 0;
    const wastedPercent = Number.isFinite(item.wastedPercent) ? Math.round(item.wastedPercent) : 0;
    console.log(`- ${url} total=${totalBytes} KiB wasted=${wastedBytes} KiB (${wastedPercent}%)`);
  });
}

async function main() {
  const url = getArgValue('--url') || process.env.SEO_PERF_URL || defaultBaseUrl;
  const timeoutMs = Number(getArgValue('--timeout') || process.env.SEO_PERF_TIMEOUT_MS || 120000);

  const thresholds = {
    performance: readThreshold('SEO_THRESHOLD_PERFORMANCE', 90),
    seo: readThreshold('SEO_THRESHOLD_SEO', 90),
    bestPractices: readThreshold('SEO_THRESHOLD_BEST_PRACTICES', 90),
  };

  console.log('\n=== Local Lighthouse Simulation ===');
  console.log(`Target URL: ${url}`);
  console.log(`Thresholds -> Performance: ${thresholds.performance}, SEO: ${thresholds.seo}, Best Practices: ${thresholds.bestPractices}`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--remote-debugging-port=0'],
  });

  try {
    const wsEndpoint = browser.wsEndpoint();
    const debuggerPort = Number(new URL(wsEndpoint).port);

    if (!Number.isFinite(debuggerPort)) {
      throw new Error('Unable to determine Chrome debugger port for Lighthouse.');
    }

    const result = await lighthouse(url, {
      logLevel: 'error',
      output: 'json',
      port: debuggerPort,
      maxWaitForLoad: timeoutMs,
      onlyCategories: ['performance', 'seo', 'best-practices'],
      formFactor: 'mobile',
      throttlingMethod: 'simulate',
      screenEmulation: {
        mobile: true,
        width: 390,
        height: 844,
        deviceScaleFactor: 2,
        disabled: false,
      },
    });

    if (!result?.lhr) {
      throw new Error('Lighthouse did not return an LHR report.');
    }

    const perf = toPercent(result.lhr.categories.performance?.score);
    const seo = toPercent(result.lhr.categories.seo?.score);
    const best = toPercent(result.lhr.categories['best-practices']?.score);
    const keyMetrics = [
      { id: 'first-contentful-paint', label: 'FCP', unit: 's' },
      { id: 'largest-contentful-paint', label: 'LCP', unit: 's' },
      { id: 'speed-index', label: 'Speed Index', unit: 's' },
      { id: 'total-blocking-time', label: 'TBT', unit: 'ms' },
      { id: 'cumulative-layout-shift', label: 'CLS', unit: 'raw' },
      { id: 'interactive', label: 'TTI', unit: 's' },
      { id: 'total-byte-weight', label: 'Transfer Size', unit: 'bytes' },
    ];
    const opportunities = collectOpportunityDiagnostics(result.lhr);

    console.log('\n=== Lighthouse Scores ===');
    console.log(`Performance: ${perf}`);
    console.log(`SEO: ${seo}`);
    console.log(`Best Practices: ${best}`);

    console.log('\n=== Key Performance Metrics ===');
    keyMetrics.forEach(({ id, label, unit }) => {
      const numericValue = Number(result.lhr.audits?.[id]?.numericValue);
      const value = unit === 'raw' ? (Number.isFinite(numericValue) ? numericValue.toFixed(3) : 'n/a') : formatMetricValue(numericValue, unit);
      console.log(`${label}: ${value}`);
    });

    if (opportunities.length > 0) {
      console.log('\n=== Top Lighthouse Opportunities ===');
      opportunities.slice(0, 8).forEach((entry) => {
        const scoreText = entry.score === null ? 'n/a' : `${entry.score}`;
        const savingsMsText = entry.savingsMs > 0 ? `${Math.round(entry.savingsMs)} ms` : '0 ms';
        const savingsBytesText = entry.savingsBytes > 0 ? `${Math.round(entry.savingsBytes / 1024)} KiB` : '0 KiB';
        console.log(`- ${entry.title} [${entry.id}] score=${scoreText} savings=${savingsMsText}, ${savingsBytesText}`);
      });
    }

    logUnusedJavaScriptDetails(result.lhr);

    const failures = [];
    if (perf < thresholds.performance) failures.push(`Performance (${perf} < ${thresholds.performance})`);
    if (seo < thresholds.seo) failures.push(`SEO (${seo} < ${thresholds.seo})`);
    if (best < thresholds.bestPractices) failures.push(`Best Practices (${best} < ${thresholds.bestPractices})`);

    if (failures.length > 0) {
      console.error('\nLighthouse test failed threshold checks:');
      failures.forEach((entry) => console.error(`- ${entry}`));
      process.exit(1);
    }

    console.log('\nLighthouse test passed threshold checks.');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Lighthouse simulation failed: ${message}`);
    console.error('Tip: ensure the target URL is reachable and the local server is running.');
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Unexpected performance test error: ${message}`);
  process.exit(1);
});
