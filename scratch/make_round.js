const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, '../frontend/src/app/icon.png');
const outputFile = path.join(__dirname, '../frontend/src/app/icon_round.png');

async function roundIcon() {
  const metadata = await sharp(inputFile).metadata();
  const size = Math.min(metadata.width, metadata.height);
  const radius = size / 2;

  const circleSvg = `<svg width="${size}" height="${size}"><circle cx="${radius}" cy="${radius}" r="${radius}" /></svg>`;

  await sharp(inputFile)
    .resize(size, size)
    .composite([{
      input: Buffer.from(circleSvg),
      blend: 'dest-in'
    }])
    .toFile(outputFile);

  fs.renameSync(outputFile, inputFile);
  console.log('Icon rounded successfully!');
}

roundIcon().catch(console.error);
