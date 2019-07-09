const fs = require("fs").promises;
const path = require("path");
const sharp = require("sharp");
const Spritesmith = require("spritesmith");
const { outAssetsPath, tmpPath } = require("./data/config");
const { getVendorSmallPath, getVendorSinglePath } = require("./utils/misc");
const { saveOutput } = require("./utils/store");

async function generate(images, vendor) {
  const dir = getVendorSmallPath(vendor);
  const sprites = images.map(image => path.join(dir, image));
  return new Promise((resolve, reject) => {
    Spritesmith.run(
      {
        src: sprites
      },
      async (err, result) => {
        if (err) {
          reject(err);
        } else {
          try {
            const { coordinates, image, properties } = result;
            const temp = path.join(tmpPath, `${vendor}.png`);
            const output = path.join(outAssetsPath, `${vendor}.png`);
            await fs.writeFile(temp, image);
            await minifySpriteSheet(temp, output);
            resolve([coordinates, properties]);
          } catch (e) {
            reject(e);
          }
        }
      }
    );
  });
}

async function moveSingleImages(images, vendor) {
  const inputDir = getVendorSinglePath(vendor);
  const outDir = path.join(outAssetsPath, vendor);

  try {
    await fs.mkdir(outDir, { recursive: true });
  } catch {}

  for (const image of images) {
    const input = path.join(inputDir, image);
    const output = path.join(outDir, image);
    await fs.copyFile(input, output);
  }
}

async function minifySpriteSheet(input, output) {
  await sharp(input)
    .png({
      compressionLevel: 9,
      adaptiveFiltering: true
    })
    .toFile(output);
}

function updateEmojis(emojis, data, vendor) {
  const dir = getVendorSmallPath(vendor);
  for (const d in data) {
    let inSkin = false;
    if (data.hasOwnProperty(d)) {
      const file = d.slice(dir.length + 1);
      if (file) {
        for (const emoji of emojis) {
          if (inSkin) {
            break;
          }
          if (emoji.image === file) {
            emoji[vendor] = data[d];
            break;
          } else {
            for (const skin of emoji.skins) {
              if (skin.image === file) {
                skin[vendor] = data[d];
                inSkin = true;
                break;
              }
            }
          }
        }
      }
    }
  }
  return emojis;
}

async function generateSpriteSheet(emojis) {
  const images = [];

  for (const emoji of emojis) {
    images.push(emoji.image);

    for (const skin of emoji.skins) {
      images.push(skin.image);
    }
  }

  const [applePos, appleProps] = await generate(images, "apple");
  const [googlePos, googleProps] = await generate(images, "google");
  await saveOutput("spritesheets.json", {
    apple: appleProps,
    google: googleProps
  });

  emojis = updateEmojis(emojis, applePos, "apple");
  emojis = updateEmojis(emojis, googlePos, "google");

  await moveSingleImages(images, "apple");
  await moveSingleImages(images, "google");

  return emojis;
}

module.exports = {
  generateSpriteSheet
};
