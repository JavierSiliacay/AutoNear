const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function createSmoothHandWavingFrames() {
  const artifactDir = 'C:\\Users\\User\\.gemini\\antigravity-ide\\brain\\1b0b0984-76d6-4477-8974-e07a2c0f86fe';
  
  // Left tilt and Right tilt frames from model
  const files = [
    'mascot_wave_left_1788013414708.jpg',
    'mascot_wave_right_1788013524957.jpg'
  ];

  const size = 360;

  for (let idx = 0; idx < files.length; idx++) {
    const filePath = path.join(artifactDir, files[idx]);
    const img = sharp(filePath).resize(size, size).ensureAlpha();
    const raw = await img.raw().toBuffer({ resolveWithObject: true });
    const data = raw.data;

    // Erase white background to 100% clean transparency
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      // Transparent threshold
      if (r > 220 && g > 220 && b > 220) {
        data[i + 3] = 0;
      }
    }

    const outPng = await sharp(data, {
      raw: { width: size, height: size, channels: 4 }
    }).png().toBuffer();

    const frameName = idx === 0 ? 'mascot-wave-left.png' : 'mascot-wave-right.png';
    fs.writeFileSync(path.join(__dirname, '..', 'public', frameName), outPng);
    console.log(`Wrote transparent frame: ${frameName}`);
  }

  // Also build animated GIF combining left and right wave
  const GIFEncoder = require('gif-encoder-2');
  const encoder = new GIFEncoder(size, size, 'neuquant', true);
  encoder.setDelay(280); // 280ms smooth wave speed
  encoder.setRepeat(0); // Infinite loop
  encoder.setTransparent(0x00000000);
  encoder.start();

  const leftBuffer = await sharp(path.join(__dirname, '..', 'public', 'mascot-wave-left.png'))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  
  const rightBuffer = await sharp(path.join(__dirname, '..', 'public', 'mascot-wave-right.png'))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  encoder.addFrame(leftBuffer.data);
  encoder.addFrame(rightBuffer.data);
  encoder.finish();

  const gifOut = encoder.out.getData();
  fs.writeFileSync(path.join(__dirname, '..', 'public', 'mascot-waving.gif'), gifOut);
  console.log('Successfully generated waving GIF!');
}

createSmoothHandWavingFrames().catch(console.error);
