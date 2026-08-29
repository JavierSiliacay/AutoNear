const fs = require('fs');
const path = require('path');
const GIFEncoder = require('gif-encoder-2');
const sharp = require('sharp');

async function createWavingGif() {
  const artifactDir = 'C:\\Users\\User\\.gemini\\antigravity-ide\\brain\\1b0b0984-76d6-4477-8974-e07a2c0f86fe';
  const files = [
    'mascot_wave_f1_1788012144931.jpg',
    'mascot_wave_f2_1788012182562.jpg',
    'mascot_wave_f3_1788012231262.jpg',
    'mascot_wave_f2_1788012182562.jpg'
  ];

  const size = 360;
  const encoder = new GIFEncoder(size, size);
  encoder.setDelay(350); // 350ms smooth wave delay
  encoder.setRepeat(0); // Loop forever
  encoder.start();

  for (const file of files) {
    const filePath = path.join(artifactDir, file);
    if (!fs.existsSync(filePath)) {
      console.error('File missing:', filePath);
      return;
    }
    const { data } = await sharp(filePath)
      .resize(size, size)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    encoder.addFrame(data);
  }

  encoder.finish();
  const buffer = encoder.out.getData();
  const outputPath = path.join(__dirname, '..', 'public', 'mascot-waving.gif');
  fs.writeFileSync(outputPath, buffer);
  console.log('Successfully created waving mascot GIF at:', outputPath);
}

createWavingGif().catch(console.error);
