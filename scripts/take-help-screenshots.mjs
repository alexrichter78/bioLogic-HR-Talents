import puppeteer from "puppeteer-core";
import { mkdirSync, existsSync } from "fs";
import { resolve } from "path";

const CHROMIUM = "/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium";
const BASE = "http://localhost:5000";
const OUT = resolve("client/public/help");
const USER = "admin";
const PASS = "Armadillo78";

const VIEWPORT = { width: 1440, height: 900, deviceScaleFactor: 1 };

const PAGES = [
  { name: "06-teamcheck.png", path: "/team-report", needsLogin: true },
  { name: "07-ki-coach.png", path: "/ki-coach", needsLogin: true },
  { name: "08-kurs.png", path: "/kurs", needsLogin: true },
];

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROMIUM,
  headless: "new",
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
});

try {
  for (const target of PAGES) {
    console.log(`[shot] ${target.name} ← ${target.path} (login=${target.needsLogin})`);

    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    await page.setViewport(VIEWPORT);

    try {
      if (target.needsLogin) {
        await page.goto(`${BASE}/`, { waitUntil: "networkidle0", timeout: 30000 });
        await page.waitForSelector('input[placeholder="Benutzername"]', { timeout: 10000 });
        await page.type('input[placeholder="Benutzername"]', USER);
        await page.type('input[type="password"]', PASS);
        await Promise.all([
          page.waitForNavigation({ waitUntil: "networkidle0", timeout: 20000 }).catch(() => {}),
          page.click('button[type="submit"]'),
        ]);
        await new Promise(r => setTimeout(r, 1200));
        if (target.path !== "/") {
          await page.goto(`${BASE}${target.path}`, { waitUntil: "networkidle0", timeout: 30000 });
        }
      } else {
        await page.goto(`${BASE}${target.path}`, { waitUntil: "networkidle0", timeout: 30000 });
      }

      await new Promise(r => setTimeout(r, 1800));
      await page.screenshot({
        path: resolve(OUT, target.name),
        fullPage: false,
        type: "png",
      });
    } finally {
      await context.close();
    }
  }

  console.log("✓ Alle Screenshots gespeichert in", OUT);
} finally {
  await browser.close();
}
