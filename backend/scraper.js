const { chromium } = require("playwright-core");

/**
 * Scrapes Friends2Support for blood donors.
 * Handles ASP.NET WebForms postbacks with correct selectors.
 */
async function scrapeDonors(params, options = {}) {
  const { maxPages = 2, onPageScraped } = options;

  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
  });

  const page = await browser.newPage();

  try {
    await page.goto(
      "https://www.friends2support.org/inner/news/searchresult.aspx",
      { waitUntil: "domcontentloaded", timeout: 30000 }
    );

    // Blood Group
    await page.selectOption("#dpBloodGroup", { label: params.bloodGroup });

    // Country → triggers postback
    await page.selectOption("#dpCountry", { label: params.country });
    await page.waitForLoadState("networkidle");

    // State → triggers postback
    await page.selectOption("#dpState", { label: params.state });
    await page.waitForLoadState("networkidle");

    // District → triggers postback
    await page.selectOption("#dpDistrict", { label: params.district });
    await page.waitForLoadState("networkidle");

    // City
    await page.selectOption("#dpCity", { label: params.city });

    // Search button
    await page.click("#btnSearchDonor");
    await page.waitForLoadState("networkidle");

    const donors = [];

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      const pageDonors = await page.evaluate(() => {
        const rows = document.querySelectorAll("table.GridItem tr, table tr");
        const results = [];
        // Find the results table by looking for rows with "Available" text
        const allRows = document.querySelectorAll("tr");
        for (const row of allRows) {
          const cells = row.querySelectorAll("td");
          if (cells.length >= 4) {
            const name = cells[0]?.innerText?.trim();
            const availability = cells[1]?.innerText?.trim();
            const mobile = cells[2]?.innerText?.trim();
            if (name && mobile && /^\d{10}$/.test(mobile) && availability === "Available") {
              results.push({ name, mobile, availability });
            }
          }
        }
        return results;
      });

      donors.push(...pageDonors);
      if (onPageScraped) onPageScraped(pageNum, pageDonors.length);

      // Try next page
      const nextLink = await page.$(`a[href*="Page$${pageNum + 1}"]`);
      if (!nextLink) break;
      await nextLink.click();
      await page.waitForLoadState("networkidle");
    }

    return donors;
  } finally {
    await browser.close();
  }
}

module.exports = { scrapeDonors };
