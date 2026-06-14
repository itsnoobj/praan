#!/usr/bin/env node
/**
 * Run: node scrape-donors.js
 * Scrapes Friends2Support and saves to data/ folder.
 * Run this independently — doesn't block anything else.
 */

const { chromium } = require("playwright-core");
const fs = require("fs");
const path = require("path");

const PARAMS = { bloodGroup: "O+", country: "INDIA", state: "Karnataka", district: "Bangalore", city: "J P Nagar" };
const MAX_PAGES = 5;
const DATA_DIR = path.join(__dirname, "..", "data");

async function scrape() {
  console.log(`🔍 Scraping Friends2Support: ${PARAMS.bloodGroup}, ${PARAMS.city}, ${PARAMS.district}\n`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(60000); // generous timeout

  await page.goto("https://www.friends2support.org/inner/news/searchresult.aspx", { waitUntil: "domcontentloaded" });

  // Fill form with waits between postbacks
  await page.selectOption("#dpBloodGroup", { label: PARAMS.bloodGroup });
  await page.selectOption("#dpCountry", { label: PARAMS.country });
  await page.waitForTimeout(2000);
  
  await page.selectOption("#dpState", { label: PARAMS.state });
  await page.waitForTimeout(2000);

  await page.selectOption("#dpDistrict", { label: PARAMS.district });
  await page.waitForTimeout(2000);

  await page.selectOption("#dpCity", { label: PARAMS.city });
  await page.waitForTimeout(1000);

  await page.click("#btnSearchDonor");
  await page.waitForTimeout(3000);

  const donors = [];

  for (let pageNum = 1; pageNum <= MAX_PAGES; pageNum++) {
    const pageDonors = await page.evaluate(() => {
      const results = [];
      for (const row of document.querySelectorAll("tr")) {
        const cells = row.querySelectorAll("td");
        if (cells.length >= 4) {
          const name = cells[0]?.innerText?.trim();
          const availability = cells[1]?.innerText?.trim();
          const mobile = cells[2]?.innerText?.trim();
          if (name && mobile && /^\d{7,10}$/.test(mobile) && availability === "Available") {
            results.push({ name, mobile, availability });
          }
        }
      }
      return results;
    });

    donors.push(...pageDonors);
    console.log(`  Page ${pageNum}: ${pageDonors.length} donors found`);

    // Try next page
    const nextLink = await page.$(`a[href*="Page$${pageNum + 1}"]`);
    if (!nextLink) {
      console.log(`  No more pages.`);
      break;
    }
    await nextLink.click();
    await page.waitForTimeout(3000);
  }

  await browser.close();

  // Save
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(path.join(DATA_DIR, "donors-jp-nagar-o-plus.json"), JSON.stringify(donors, null, 2));

  const csv = "Mobile Number,Name,Blood Group,City\n" + donors.map(d => `+91${d.mobile},${d.name},O+,J P Nagar`).join("\n");
  fs.writeFileSync(path.join(DATA_DIR, "donors-jp-nagar-o-plus.csv"), csv);

  console.log(`\n✅ Done! ${donors.length} donors saved to data/`);
  console.log(`   JSON: data/donors-jp-nagar-o-plus.json`);
  console.log(`   CSV:  data/donors-jp-nagar-o-plus.csv`);
}

scrape().catch(e => {
  console.error("❌ Scraper failed:", e.message);
  process.exit(1);
});
