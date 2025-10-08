// lib/puppeteer.js
// Cross-env Puppeteer launcher: full Puppeteer locally, puppeteer-core + @sparticuz/chromium on Vercel.

export async function launchBrowser() {
  const isVercel = !!process.env.VERCEL;

  if (isVercel) {
    const chromium = (await import("@sparticuz/chromium")).default;
    const puppeteer = await import("puppeteer-core");

    // Optional: force a known compatible Chrome channel on Vercel if needed
    // chromium.setHeadlessMode = true; // default true
    // chromium.setGraphicsMode = false;

    return puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  }

  // Local dev: use full Puppeteer
  const puppeteer = await import("puppeteer");
  return puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
}

/** Render HTML to a PDF buffer (works both locally and on Vercel). */
export async function htmlToPdfBuffer(html) {
  const browser = await launchBrowser();
  const page = await browser.newPage();

  // Load HTML and wait for network to be idle.
  await page.setContent(html, { waitUntil: "networkidle0" });

  // If your invoice uses images (e.g., logo/stamp), wait for them explicitly:
  await page.evaluate(async () => {
    const imgs = Array.from(document.images || []);
    await Promise.all(
      imgs.map(
        (img) =>
          new Promise((resolve) => {
            if (img.complete) return resolve();
            img.addEventListener("load", resolve, { once: true });
            img.addEventListener("error", resolve, { once: true });
          })
      )
    );
  });

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top: "14mm", bottom: "16mm", left: "12mm", right: "12mm" },
  });

  await page.close();
  await browser.close();
  return pdfBuffer;
}
