// lib/puppeteer.js
// Works locally (full puppeteer) and on Vercel (puppeteer-core + @sparticuz/chromium)

export async function launchBrowser() {
  const isVercel = !!process.env.VERCEL;

  if (isVercel) {
    const chromium = (await import("@sparticuz/chromium")).default;
    const puppeteer = await import("puppeteer-core");

    return puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  }

  const puppeteer = await import("puppeteer");
  return puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
}

/** Render HTML to a PDF Buffer (waits for images). */
export async function htmlToPdfBuffer(html) {
  const browser = await launchBrowser();
  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: "networkidle0" });

  // Ensure all images finished (important for logos/stamps on Vercel)
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

  const pdf = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top: "14mm", bottom: "16mm", left: "12mm", right: "12mm" },
  });

  await page.close();
  await browser.close();
  return pdf;
}
