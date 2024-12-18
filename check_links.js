const puppeteer = require('puppeteer');

(async () => {
  const targetUrl = process.env.TARGET_URL || 'https://example.com';
  const ALLOWED_DOMAIN = process.env.ALLOWED_DOMAIN || 'example.com';
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  try {
    console.log(`Navigating to ${targetUrl}`);
    const response = await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });

    if (!response || response.status() >= 400) {
      console.error(`Failed to load the target URL: ${targetUrl} with status ${response ? response.status() : 'no response'}`);
      process.exit(1);
    }

    // ページ内のすべてのリンクを取得
    const links = await page.$$eval('a', anchors => anchors.map(anchor => anchor.href));
    console.log(`Found ${links.length} links`);

    const validLinks = links.filter(link => {
      try {
        return link && new URL(link);
      } catch {
        return false;
      }
    });

    const domainFilteredLinks = validLinks.filter(link => {
      const url = new URL(link);
      if (url.hostname !== ALLOWED_DOMAIN) {
        console.log(`Skip: ${link}`);
        return false;
      }
      return true;
    });

    const normalizedLinks = domainFilteredLinks.map(link => {
      const url = new URL(link);
      // フラグメントを除去
      let finalLink = url.origin + url.pathname + url.search;
      // 空のパスの場合、スラッシュを追加
      if (url.pathname === '' || url.pathname === '/') {
        finalLink = `${url.origin}/` + url.search;
      }
      return finalLink;
    });

    const uniqueLinks = [...new Set(normalizedLinks)];
    const sortedLinks = uniqueLinks.sort((a, b) => a.localeCompare(b));

    console.log(`Checking ${sortedLinks.length} unique links within domain: ${ALLOWED_DOMAIN}`);

    const brokenLinks = [];
    for (const link of sortedLinks) {
      console.log(`Checking link: ${link}`);
      try {
        const response = await page.goto(link, { waitUntil: 'domcontentloaded' });

        if (response) {
          const status = response.status();
          if (status === 404) {
            brokenLinks.push(link);
            console.error(`Broken link (404): ${link}`);
          } else if (status >= 400) {
            brokenLinks.push(link);
            console.error(`Broken link (${status}): ${link}`);
          }
        } else {
          console.warn(`No response received for link: ${link}`);
          brokenLinks.push(link);
        }
      } catch (error) {
        console.error(`Error checking link: ${link}`, error);
        brokenLinks.push(link);
      }
    }

    if (brokenLinks.length > 0) {
      console.error(`Found ${brokenLinks.length} broken links:`);
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
