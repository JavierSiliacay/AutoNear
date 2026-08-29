const fs = require('fs');
const path = require('path');
const GIFEncoder = require('gif-encoder-2');
const sharp = require('sharp');

async function createSadGif() {
  const artifactDir = 'C:\\Users\\User\\.gemini\\antigravity-ide\\brain\\1b0b0984-76d6-4477-8974-e07a2c0f86fe';
  const files = [
    'mascot_cry_f1_1787986705131.jpg',
    'mascot_cry_f2_1787986727504.jpg',
    'mascot_cry_f3_1787986755463.jpg',
    'mascot_cry_f4_1787986778560.jpg',
    'mascot_cry_f3_1787986755463.jpg',
    'mascot_cry_f2_1787986727504.jpg',
    'mascot_cry_f1_1787986705131.jpg',
    'mascot_cry_f2_1787986727504.jpg'
  ];

  const size = 320;
  const encoder = new GIFEncoder(size, size);
  encoder.setDelay(450); // 450ms per frame for emotional pacing
  encoder.setRepeat(0); // Loop indefinitely
  encoder.start();

  for (const file of files) {
    const filePath = path.join(artifactDir, file);
    const { data } = await sharp(filePath)
      .resize(size, size)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    encoder.addFrame(data);
  }

  encoder.finish();
  const buffer = encoder.out.getData();
  const outputPath = path.join(__dirname, '..', 'public', 'mascot-crying.gif');
  fs.writeFileSync(outputPath, buffer);
  console.log('Successfully generated sad crying mascot GIF at:', outputPath);
}

createSadGif().catch(console.error);
