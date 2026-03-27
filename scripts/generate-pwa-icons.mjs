import sharp from "sharp";
import { readFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const BG_COLOR = "#0A3A3A";
const SIZES = [192, 384, 512];
const PADDING_RATIO = 0.10;

const logoSvg = readFileSync(resolve(ROOT, "designs/logo/logo-white.svg"), "utf-8");

// Parse viewBox to get logo dimensions
const viewBoxMatch = logoSvg.match(/viewBox="([\d.\s]+)"/);
if (!viewBoxMatch) throw new Error("No viewBox found in SVG");
const [vbX, vbY, vbW, vbH] = viewBoxMatch[1].split(/\s+/).map(Number);

mkdirSync(resolve(ROOT, "public/icons"), { recursive: true });

for (const size of SIZES) {
  const padding = Math.round(size * PADDING_RATIO);
  const contentArea = size - padding * 2;

  // Scale logo to fit content area while preserving aspect ratio
  const logoAspect = vbW / vbH;
  let logoW, logoH;
  if (logoAspect > 1) {
    logoW = contentArea;
    logoH = Math.round(contentArea / logoAspect);
  } else {
    logoH = contentArea;
    logoW = Math.round(contentArea * logoAspect);
  }

  // Center offsets
  const left = Math.round((size - logoW) / 2);
  const top = Math.round((size - logoH) / 2);

  // Render logo SVG at target size
  const resizedSvg = logoSvg.replace(
    /viewBox="[^"]*"/,
    `viewBox="${vbX} ${vbY} ${vbW} ${vbH}" width="${logoW}" height="${logoH}"`
  );

  const logoPng = await sharp(Buffer.from(resizedSvg))
    .resize(logoW, logoH)
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BG_COLOR,
    },
  })
    .composite([{ input: logoPng, left, top }])
    .png()
    .toFile(resolve(ROOT, `public/icons/icon-${size}.png`));

  console.log(`Generated icon-${size}.png`);
}

// Generate apple-touch-icon (180x180)
const appleSize = 180;
const applePadding = Math.round(appleSize * PADDING_RATIO);
const appleContent = appleSize - applePadding * 2;
const appleAspect = vbW / vbH;
const appleLogoW = appleContent;
const appleLogoH = Math.round(appleContent / appleAspect);
const appleLeft = Math.round((appleSize - appleLogoW) / 2);
const appleTop = Math.round((appleSize - appleLogoH) / 2);

const appleSvg = logoSvg.replace(
  /viewBox="[^"]*"/,
  `viewBox="${vbX} ${vbY} ${vbW} ${vbH}" width="${appleLogoW}" height="${appleLogoH}"`
);

const appleLogoPng = await sharp(Buffer.from(appleSvg))
  .resize(appleLogoW, appleLogoH)
  .png()
  .toBuffer();

await sharp({
  create: {
    width: appleSize,
    height: appleSize,
    channels: 4,
    background: BG_COLOR,
  },
})
  .composite([{ input: appleLogoPng, left: appleLeft, top: appleTop }])
  .png()
  .toFile(resolve(ROOT, "public/icons/apple-touch-icon.png"));

console.log("Generated apple-touch-icon.png (180x180)");

console.log("Done!");
