const puppeteer = require('puppeteer');

(async () => {
  const targetUrl = process.env.TARGET_URL || 'https://example.com';
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  try {
    console.log(`Navigating to ${targetUrl}`);
    await page.goto(targetUrl);

    // ページ内のすべてのリンクを取得
    const links = await page.$$eval('a', anchors => anchors.map(anchor => anchor.href));
    console.log(`Found ${links.length} links`);

    const brokenLinks = [];

    for (const link of links) {
      console.log(`Checking link: ${link}`);
      try {
        const response = await page.goto(link, { waitUntil: 'domcontentloaded' });
        if (response.status() === 404) {
          brokenLinks.push(link);
          console.error(`Broken link: ${link}`);
        }
      } catch (error) {
        console.error(`Error checking link: ${link}`, error);
        brokenLinks.push(link);
      }
    }

    if (brokenLinks.length > 0) {
      console.error(`Found ${brokenLinks.length} broken links`);
      brokenLinks.forEach(link => console.error(link));
      process.exit(1);
    } else {
      console.log('No broken links found');
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
