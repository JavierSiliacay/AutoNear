const fs = require('fs');
const path = require('path');
const GIFEncoder = require('gif-encoder-2');
const sharp = require('sharp');

async function createGif() {
  const artifactDir = 'C:\\Users\\User\\.gemini\\antigravity-ide\\brain\\1b0b0984-76d6-4477-8974-e07a2c0f86fe';
  const files = [
    'tarafix_frame_1_1787980886676.jpg',
    'tarafix_frame_2_1787980914533.jpg',
    'tarafix_frame_3_1787980934699.jpg',
    'tarafix_frame_4_1787980962891.jpg',
    'tarafix_frame_3_1787980934699.jpg',
    'tarafix_frame_2_1787980914533.jpg'
  ];

  const size = 320;
  const encoder = new GIFEncoder(size, size);
  encoder.setDelay(400); // 400ms per frame
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
  const outputPath = path.join(__dirname, '..', 'public', 'mascot-animated.gif');
  fs.writeFileSync(outputPath, buffer);
  console.log('Successfully generated animated GIF at:', outputPath);
}

createGif().catch(console.error);
