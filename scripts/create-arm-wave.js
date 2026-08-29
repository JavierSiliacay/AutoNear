const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function createSmoothArmWavingAnimation() {
  const baseFramePath = path.join(__dirname, '..', 'public', 'mascot-frame-1.png');
  const size = 360;

  // Load the base image
  const baseImage = sharp(baseFramePath);
  const metadata = await baseImage.metadata();

  // Create character base (body + left wrench hand) and isolate the waving right hand
  // In the 360x360 image, the right hand & forearm are in the right quadrant (x: ~240 to 360, y: ~100 to 320)
  
  // Frame 1: Original hand position (0 deg)
  // Frame 2: Hand waved inward (-8 deg tilt)
  // Frame 3: Hand waved outward (+8 deg tilt)
  // Frame 4: Neutral return

  // We can create 6 distinct rotational keyframe PNGs using Sharp composite!
  const imgBuffer = await sharp(baseFramePath).resize(size, size).png().toBuffer();
  
  // Save as high-res animated GIF with explicit multi-layer GIF encoding
  const GIFEncoder = require('gif-encoder-2');
  const encoder = new GIFEncoder(size, size, 'neuquant', true);
  encoder.setDelay(200); // 200ms per frame
  encoder.setRepeat(0); // Loop forever
  encoder.setTransparent(0x00000000);
  encoder.start();

  // Generate 6 frames with wave rotation
  const angles = [0, -7, -14, -7, 0, 7, 14, 7];

  for (let i = 0; i < angles.length; i++) {
    const angle = angles[i];
    
    // Rotate slightly around the shoulder/elbow pivot
    // Extract the waving arm (right side of image)
    const armWidth = 140;
    const armHeight = 220;
    const armLeft = 220;
    const armTop = 100;

    const armExtracted = await sharp(imgBuffer)
      .extract({ left: armLeft, top: armTop, width: armWidth, height: armHeight })
      .png()
      .toBuffer();

    // Rotate arm
    const rotatedArm = await sharp(armExtracted)
      .rotate(angle, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .resize(armWidth, armHeight, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    // Body with arm blanked out
    const bodyBase = await sharp(imgBuffer)
      .composite([
        {
          input: Buffer.from(
            `<svg width="${size}" height="${size}"><rect x="${armLeft}" y="${armTop}" width="${armWidth}" height="${armHeight}" fill="none"/></svg>`
          ),
          blend: 'dest-out'
        }
      ])
      .png()
      .toBuffer();

    // Composite rotated arm back onto body
    const finalFrame = await sharp(imgBuffer)
      // Subtle shoulder sway + waving
      .composite([
        {
          input: rotatedArm,
          top: armTop,
          left: armLeft,
          blend: 'over'
        }
      ])
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Ensure transparency
    const rawData = finalFrame.data;
    for (let p = 0; p < rawData.length; p += 4) {
      if (rawData[p] > 230 && rawData[p + 1] > 230 && rawData[p + 2] > 230) {
        rawData[p + 3] = 0;
      }
    }

    encoder.addFrame(rawData);

    // Also write individual frame PNGs for React CSS rotation
    const framePng = await sharp(rawData, {
      raw: { width: size, height: size, channels: 4 }
    }).png().toBuffer();
    fs.writeFileSync(path.join(__dirname, '..', 'public', `mascot-wave-${i + 1}.png`), framePng);
  }

  encoder.finish();
  const gifData = encoder.out.getData();
  fs.writeFileSync(path.join(__dirname, '..', 'public', 'mascot-waving.gif'), gifData);
  console.log('Successfully created animated waving arm mascot frames and GIF!');
}

createSmoothArmWavingAnimation().catch(console.error);
