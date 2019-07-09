const emojiRegex = require("emoji-regex");
const fs = require("fs");
const path = require("path");
const { uniq } = require("lodash");
const rimraf = require("rimraf");
const sharp = require("sharp");
const {
  emojiSize,
  emojiSpriteSize,
  tmpImagesPath,
  tmpPath
} = require("../data/config");
const duplicates = require("../data/duplicates");
const emoticons = require("../data/emoticons");

async function empty(glob) {
  return new Promise(resolve => {
    rimraf(glob, () => resolve());
  });
}

async function delay(time = 1000) {
  return new Promise(resolve => {
    setTimeout(() => resolve(), time);
  });
}

function getIdFromUrl(url) {
  return url.replace(/[^\w-]+/g, "");
}

function getVendorSmallPath(vendor) {
  return path.join(tmpPath, `${vendor}-${emojiSpriteSize}`);
}

function getVendorSinglePath(vendor) {
  return path.join(tmpPath, `${vendor}-${emojiSize}`);
}

async function resizeEmojiImages(vendor, fileName) {
  const input = path.join(tmpImagesPath, vendor, fileName);
  const outputDir = getVendorSmallPath(vendor);
  const output = path.join(outputDir, fileName);
  const singleEmojiOutputDir = getVendorSinglePath(vendor);
  const singleEmojiOutput = path.join(singleEmojiOutputDir, fileName);

  let needForSprite = true;
  let needForSingle = true;

  try {
    await fs.promises.mkdir(outputDir, { recursive: true });
    await fs.promises.mkdir(singleEmojiOutputDir, { recursive: true });
  } catch {}

  try {
    await fs.promises.access(output, fs.constants.F_OK);
    needForSprite = false;
  } catch {
    needForSprite = true;
  }

  try {
    await fs.promises.access(singleEmojiOutput, fs.constants.F_OK);
    needForSingle = false;
  } catch {
    needForSingle = true;
  }

  if (!needForSprite && !needForSingle) {
    return;
  }

  try {
    if (needForSprite) {
      await sharp(input)
        .resize({
          width: emojiSpriteSize,
          fit: "inside",
          withoutEnlargement: true
        })
        .png({
          compressionLevel: 9,
          adaptiveFiltering: true
        })
        .toFile(output);
    }
    if (needForSingle) {
      await sharp(input)
        .resize({
          width: emojiSize,
          fit: "inside",
          withoutEnlargement: true
        })
        .png({
          compressionLevel: 9,
          adaptiveFiltering: true
        })
        .toFile(singleEmojiOutput);
    }
  } catch (e) {
    console.error(e);
  }
}

function removeDuplicatesByCategories(emojis) {
  return fixOrder(
    emojis.filter(e => {
      let keep = true;
      for (const [id, categoryId] of duplicates.byCategories) {
        if (e.id === id && e.categoryId === categoryId) {
          keep = false;
          break;
        }
      }
      return keep;
    })
  );
}

function removeDuplicatesByGenders(emojis) {
  const dontKeep = [];

  for (const [rmId, rpId] of duplicates.byGenders) {
    const rmIndex = emojis.findIndex(e => e.id === rmId);
    const rpIndex = emojis.findIndex(e => e.id === rpId);

    if (rmIndex > -1 && rpIndex > -1) {
      dontKeep.push(rmId);
      emojis[rpIndex].shortcodes = uniq([
        ...emojis[rpIndex].shortcodes,
        ...emojis[rmIndex].shortcodes
      ]);
    }
  }

  return fixOrder(emojis.filter(e => !dontKeep.includes(e.id)));
}

function fixOrder(emojis) {
  return emojis.map((e, i) => {
    e.order = i;
    for (const s of e.skins) {
      s.order = i;
    }
    return e;
  });
}

function getMaps(emojis) {
  const categoriesMap = {};
  const emoticonsMap = {};
  const nativesMap = {};
  const shortcodesMap = {};

  for (const emoji of emojis) {
    const { categoryId, id, native, skins } = emoji;

    // categories (we should ignore skins here, they share their parent's category anyway)
    if (!categoriesMap.hasOwnProperty(categoryId)) {
      categoriesMap[categoryId] = [];
    }
    if (!categoriesMap[categoryId].includes(id)) {
      categoriesMap[categoryId].push(id);
    }

    // natives
    if (!nativesMap.hasOwnProperty(native) && !nativesMap[native]) {
      nativesMap[native] = id;
      for (const k of skins) {
        if (!nativesMap.hasOwnProperty(k.native) && !nativesMap[k.native]) {
          nativesMap[k.native] = k.id;
        }
      }
    }
    // emoticons (skins don't have emoticons)
    for (const e of emoji.emoticons) {
      if (!emoticonsMap.hasOwnProperty(e) && !emoticonsMap[e]) {
        emoticonsMap[e] = id;
      }
    }
    // shortcodes (skins don't have shortcodes)
    for (const s of emoji.shortcodes) {
      if (!shortcodesMap.hasOwnProperty(s) && !shortcodesMap[s]) {
        shortcodesMap[s] = id;
      }
    }
  }

  return {
    categories: categoriesMap,
    emoticons: emoticonsMap,
    natives: nativesMap,
    shortcodes: shortcodesMap
  };
}

function getRegex() {
  return {
    emojis: getEmojisRegex(),
    emoticons: getEmoticonsRegex()
  };
}

function getEmojisRegex() {
  const rxs = emojiRegex().toString();
  const last = rxs.lastIndexOf("/");
  return {
    source: rxs.slice(1, last),
    modifiers: rxs.slice(last + 1)
  };
}

function getEmoticonsRegex() {
  const a = [];
  for (const i in emoticons) {
    const emoticon = i
      .replace(/\&/g, "&amp;")
      .replace(/\</g, "&lt;")
      .replace(/\>/g, "&gt;");
    a.push(escapeRegex(emoticon));
  }
  return {
    source: `(^|\\s)(${a.join("|")})(?=$|[\\s|\\?\\.,!])`,
    modifiers: "g"
  };
}

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

module.exports = {
  delay,
  empty,
  fixOrder,
  getIdFromUrl,
  getMaps,
  getRegex,
  getVendorSmallPath,
  getVendorSinglePath,
  removeDuplicatesByCategories,
  removeDuplicatesByGenders,
  resizeEmojiImages
};
