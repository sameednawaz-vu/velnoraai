import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('https://velnoraai.app/', { waitUntil: 'networkidle2' });
  // Scroll to bottom to ensure footer is rendered
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'scripts/test/production-footer.png', fullPage: true });
  await browser.close();
  console.log('Screenshot saved to scripts/test/production-footer.png');
})();
