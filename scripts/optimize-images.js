const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function optimizeImages() {
  const publicDir = path.resolve(__dirname, '..', 'public');

  console.log('--- Starting Image Optimization ---');

  // 1. Favicon (64x64)
  const faviconPath = path.join(publicDir, 'favicon.png');
  const faviconBackup = path.join(publicDir, 'favicon.orig.png');
  if (fs.existsSync(faviconPath) && !fs.existsSync(faviconBackup)) {
    fs.copyFileSync(faviconPath, faviconBackup);
  }
  const faviconBuf = await sharp(faviconBackup || faviconPath)
    .resize(64, 64, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
  fs.writeFileSync(faviconPath, faviconBuf);
  console.log(`favicon.png optimized: ${(faviconBuf.length / 1024).toFixed(1)} KB`);

  // 2. Logo (256x256)
  const logoPath = path.join(publicDir, 'logo.png');
  const logoBackup = path.join(publicDir, 'logo.orig.png');
  if (fs.existsSync(logoPath) && !fs.existsSync(logoBackup)) {
    fs.copyFileSync(logoPath, logoBackup);
  }
  const logoBuf = await sharp(logoBackup || logoPath)
    .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
  fs.writeFileSync(logoPath, logoBuf);

  const logoWebpBuf = await sharp(logoBackup || logoPath)
    .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 85, effort: 6 })
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'logo.webp'), logoWebpBuf);
  console.log(`logo.png optimized: ${(logoBuf.length / 1024).toFixed(1)} KB, logo.webp: ${(logoWebpBuf.length / 1024).toFixed(1)} KB`);

  // 3. Privacy and Security Card Images
  const cardImages = [
    { dir: 'privacy', name: 'share-only' },
    { dir: 'privacy', name: 'temporary-qr' },
    { dir: 'privacy', name: 'passwordless-otp' },
    { dir: 'privacy', name: 'instant-revocation' },
    { dir: 'privacy', name: 'verification-log' },
    { dir: 'security', name: 'silicon-sealed' },
    { dir: 'security', name: 'sha256-chain' },
    { dir: 'security', name: 'shredder' },
    { dir: 'security', name: 'anti-screenshot' },
    { dir: 'security', name: 'zero-trackers' },
  ];

  let totalOld = 0;
  let totalNewWebp = 0;
  let totalNewPng = 0;

  for (const item of cardImages) {
    const pngPath = path.join(publicDir, item.dir, `${item.name}.png`);
    const backupPath = path.join(publicDir, item.dir, `${item.name}.orig.png`);
    const webpPath = path.join(publicDir, item.dir, `${item.name}.webp`);

    if (fs.existsSync(pngPath) && !fs.existsSync(backupPath)) {
      fs.copyFileSync(pngPath, backupPath);
    }

    const sourceFile = fs.existsSync(backupPath) ? backupPath : pngPath;
    const oldSize = fs.statSync(sourceFile).size;
    totalOld += oldSize;

    // Generate WebP
    const webpBuf = await sharp(sourceFile)
      .resize({ width: 1000, withoutEnlargement: true })
      .webp({ quality: 82, effort: 6 })
      .toBuffer();
    fs.writeFileSync(webpPath, webpBuf);
    totalNewWebp += webpBuf.length;

    // Also optimize PNG fallback
    const pngBuf = await sharp(sourceFile)
      .resize({ width: 1000, withoutEnlargement: true })
      .png({ compressionLevel: 9, quality: 80, palette: true })
      .toBuffer();
    fs.writeFileSync(pngPath, pngBuf);
    totalNewPng += pngBuf.length;

    console.log(`${item.dir}/${item.name}: old ${(oldSize / 1024).toFixed(1)} KB -> webp ${(webpBuf.length / 1024).toFixed(1)} KB, png ${(pngBuf.length / 1024).toFixed(1)} KB`);
  }

  console.log('--- Summary ---');
  console.log(`Original Card Images: ${(totalOld / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Optimized WebP: ${(totalNewWebp / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Optimized PNG: ${(totalNewPng / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Reduction: ${((1 - (totalNewWebp / totalOld)) * 100).toFixed(1)}%`);
}

optimizeImages().catch(err => {
  console.error('Optimization failed:', err);
  process.exit(1);
});
