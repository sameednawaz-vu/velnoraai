import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

function hasEnv(name) {
  const value = process.env[name];
  return typeof value === 'string' && value.trim().length > 0;
}

function runNodeScript(scriptPath, args = []) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(process.execPath, [scriptPath, ...args], {
      stdio: 'inherit',
      env: process.env,
    });

    child.on('error', rejectRun);
    child.on('exit', (code) => {
      if (code === 0) {
        resolveRun();
        return;
      }
      rejectRun(new Error(`${scriptPath} exited with code ${code}`));
    });
  });
}

async function main() {
  console.log('\n=== SEO Keyword Workflow ===');
  console.log('1) Generate keyword intel from Apify/fallback seeds');
  console.log('2) Validate Google Search Console access if configured');
  console.log('3) Validate Bing Webmaster access if configured');

  await runNodeScript(resolve('scripts/seo/research-keywords-apify.mjs'));

  if (hasEnv('GSC_SERVICE_ACCOUNT_JSON_PATH') && hasEnv('GSC_SITE_URL')) {
    await runNodeScript(resolve('scripts/seo/gsc-check.mjs'));
  } else {
    console.log('\nSkipping GSC check (set GSC_SERVICE_ACCOUNT_JSON_PATH and GSC_SITE_URL to enable).');
  }

  if (hasEnv('BING_WEBMASTER_API_KEY') && hasEnv('BING_SITE_URL')) {
    await runNodeScript(resolve('scripts/seo/bing-webmaster-check.mjs'), ['--confirm']);
  } else {
    console.log('Skipping Bing check (set BING_WEBMASTER_API_KEY and BING_SITE_URL to enable).');
  }

  console.log('\nSEO keyword workflow completed.');
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`SEO keyword workflow failed: ${message}`);
  process.exit(1);
});
