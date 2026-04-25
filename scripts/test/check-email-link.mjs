import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.goto('https://velnoraai.app/', { waitUntil: 'networkidle2' });
  const hasEmail = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a'));
    return links.some(a => a.href.includes('sameednawaz1'));
  });
  console.log('Production has email link:', hasEmail);
  await browser.close();
})();
