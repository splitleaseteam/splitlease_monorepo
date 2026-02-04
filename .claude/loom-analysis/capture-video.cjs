const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const videos = [
  'https://www.loom.com/share/931366d0a01643008f0a6f645a7a1b1d',
  'https://www.loom.com/share/32f0a34f9c4141d0a850f17a6495b3c7',
  'https://www.loom.com/share/39132202a3074c9c8301ec5a0b0a4389',
  'https://www.loom.com/share/383d134a685e40f09a01ff8f4a45d45e',
  'https://www.loom.com/share/e9396fc22e114a0c8f59811473b9869e'
];

const outputDir = path.join(__dirname, '.claude', 'loom-analysis');

async function analyzeVideo(url, videoNum) {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  console.log(`\n=== Video ${videoNum}: ${url} ===`);

  try {
    // Navigate to video
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Take initial snapshot
    const initialSnapshot = await page.accessibility.snapshot();
    fs.writeFileSync(
      path.join(outputDir, `video${videoNum}-initial-snapshot.json`),
      JSON.stringify(initialSnapshot, null, 2)
    );

    // Take initial screenshot
    await page.screenshot({
      path: path.join(outputDir, `video${videoNum}-initial.png`),
      fullPage: true
    });

    // Try to get video metadata
    const videoElement = await page.$('video');
    let duration = 'unknown';

    if (videoElement) {
      duration = await videoElement.evaluate(el => el.duration || 'unknown');
      console.log(`Video duration: ${duration} seconds`);

      // Try to get title
      const title = await page.title();
      console.log(`Page title: ${title}`);
    }

    // Look for text content on page (description, comments, etc.)
    const pageText = await page.evaluate(() => {
      // Get visible text
      return document.body.innerText;
    });

    fs.writeFileSync(
      path.join(outputDir, `video${videoNum}-page-text.txt`),
      pageText
    );

    // Look for specific elements
    const elements = await page.evaluate(() => {
      return {
        hasVideo: !!document.querySelector('video'),
        hasPlayButton: !!document.querySelector('[data-testid="play-button"], button[aria-label*="play"], button[aria-label*="Play"]'),
        hasTranscript: !!document.querySelector('[data-testid="transcript"], [class*="transcript"]'),
        hasComments: !!document.querySelector('[data-testid="comments"], [class*="comment"]'),
        title: document.title,
        url: window.location.href
      };
    });

    fs.writeFileSync(
      path.join(outputDir, `video${videoNum}-metadata.json`),
      JSON.stringify(elements, null, 2)
    );

    console.log('Metadata:', JSON.stringify(elements, null, 2));

    // Wait a bit to see if we can capture more info
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error(`Error analyzing video ${videoNum}:`, error.message);
  } finally {
    await browser.close();
  }
}

async function main() {
  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (let i = 0; i < videos.length; i++) {
    await analyzeVideo(videos[i], i + 1);
    // Wait between videos
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n=== All videos analyzed ===');
  console.log(`Results saved to: ${outputDir}`);
}

main().catch(console.error);
