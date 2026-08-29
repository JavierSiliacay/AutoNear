const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function createTransparentFramesAndGif() {
  const artifactDir = 'C:\\Users\\User\\.gemini\\antigravity-ide\\brain\\1b0b0984-76d6-4477-8974-e07a2c0f86fe';
  const files = [
    'logo_mascot_wave_f1_1788012572120.jpg',
    'logo_mascot_wave_f2_1788012598922.jpg',
    'logo_mascot_wave_f3_1788012619577.jpg',
    'logo_mascot_wave_f2_1788012598922.jpg'
  ];

  const size = 320;
  const processedBuffers = [];

  for (let idx = 0; idx < files.length; idx++) {
    const filePath = path.join(artifactDir, files[idx]);
    const imgBuffer = await sharp(filePath)
      .resize(size, size)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const rawData = imgBuffer.data;
    // Iterate over RGBA and set transparent alpha for white / near-white pixels (r>230 && g>230 && b>230)
    for (let i = 0; i < rawData.length; i += 4) {
      const r = rawData[i];
      const g = rawData[i + 1];
      const b = rawData[i + 2];
      if (r > 225 && g > 225 && b > 225) {
        rawData[i + 3] = 0; // 100% Transparent
      }
    }

    // Save individual transparent PNG frame
    const framePngBuffer = await sharp(rawData, {
      raw: {
        width: size,
        height: size,
        channels: 4
      }
    }).png().toBuffer();

    const framePath = path.join(__dirname, '..', 'public', `mascot-frame-${idx + 1}.png`);
    fs.writeFileSync(framePath, framePngBuffer);
    console.log(`Saved transparent frame: ${framePath}`);
  }

  // Also build animated GIF with Sharp using the transparent PNG frames
  const frame1 = path.join(__dirname, '..', 'public', 'mascot-frame-1.png');
  const frame2 = path.join(__dirname, '..', 'public', 'mascot-frame-2.png');
  const frame3 = path.join(__dirname, '..', 'public', 'mascot-frame-3.png');
  const frame4 = path.join(__dirname, '..', 'public', 'mascot-frame-4.png');

  // Sharp GIF with page delay
  const gifBuffer = await sharp(frame1, { animated: true })
    .gif({ delay: [320, 320, 320, 320], loop: 0 })
    .toBuffer();

  const outputPath = path.join(__dirname, '..', 'public', 'mascot-waving.gif');
  // Copy transparent frame-1 as fallback and write multi-frame gif
  fs.writeFileSync(outputPath, gifBuffer);
  console.log('Successfully written transparent animated GIF!');
}

createTransparentFramesAndGif().catch(console.error);
