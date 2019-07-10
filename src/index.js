"use strict";

const fs = require("fs").promises;
const path = require("path");
const {
  getHomePageCategoriesUrl,
  getCategoryPageData,
  getCategoryPageEmojisUrl
} = require("./categories");
const config = require("./data/config");
const emoticons = require("./data/emoticons");
const { getEmojiPageData } = require("./emojis");
const { addExternalEmojiData } = require("./libs");
const { generateSpriteSheet } = require("./sprite");
const { getHomePage, getCategoryPage, getEmojiPage } = require("./utils/http");
const {
  delay,
  empty,
  fixOrder,
  getIdFromUrl,
  getMaps,
  getRegex,
  removeDuplicatesByCategories,
  removeDuplicatesByGenders
} = require("./utils/misc");
const { saveOutput } = require("./utils/store");

async function init() {
  console.log("\x1Bc");
  console.log("Loading data...");

  try {
    await fs.mkdir(config.outAssetsPath, { recursive: true });
    await fs.mkdir(config.outDataPath, { recursive: true });
    await fs.mkdir(config.tmpPagesPath, { recursive: true });
    await fs.mkdir(config.tmpImagesPath, { recursive: true });
  } catch {}

  await delay(1000);
  const categories = [];
  let emojis = [];
  const homePage = await getHomePage();
  const categoriesUrl = await getHomePageCategoriesUrl(homePage);
  let emojiOrder = 0;

  for (const categoryUrl of categoriesUrl) {
    const categoryPage = await getCategoryPage(categoryUrl);
    const categoryData = getCategoryPageData(categoryPage);
    const categoryEmojisUrl = getCategoryPageEmojisUrl(categoryPage);
    const categoryId = getIdFromUrl(categoryUrl);

    categoryData.id = categoryId;
    categoryData.order = categoriesUrl.indexOf(categoryUrl);
    categories.push(categoryData);

    for (const emojiUrl of categoryEmojisUrl) {
      const emojiId = getIdFromUrl(emojiUrl);
      const emojiPage = await getEmojiPage(emojiUrl);
      const emojiData = await getEmojiPageData(emojiPage, {
        id: emojiId,
        order: emojiOrder,
        categoryId
      });

      if (!emojiData) {
        continue;
      }

      emojis.push(emojiData);
      emojiOrder += 1;

      console.log("\x1Bc");
      console.log("Loading data...");
      console.log(emojiData.order, emojiData.native);
    }
  }

  emojis = removeDuplicatesByCategories(emojis);
  emojis = await addExternalEmojiData(emojis);
  emojis = removeDuplicatesByGenders(emojis);
  emojis = fixOrder(emojis);

  try {
    console.log("\x1Bc");
    console.log("Generating sprite sheets...");
    await empty(path.join(config.outAssetsPath, "*"));
    await empty(path.join(config.outDataPath, "*"));
    emojis = await generateSpriteSheet(emojis);
  } catch (e) {
    console.error(e);
    return;
  }

  console.log("\x1Bc");
  console.log("Saving output...");
  await saveOutput("categories.json", categories);
  await saveOutput("emoticons.json", emoticons);
  await saveOutput("emojis.json", emojis);
  await saveOutput("maps.json", getMaps(emojis));
  await saveOutput("regex.json", getRegex());
  await delay(1000);

  console.log("\x1Bc");
  console.log("Data files");
  console.log("# Categories", path.join(config.outDataPath, "categories.json"));
  console.log("# Emojis", path.join(config.outDataPath, "emojis.json"));
  console.log(
    "# Sprite sheets",
    path.join(config.outDataPath, "spritesheets.json")
  );
  console.log("# Regex", path.join(config.outDataPath, "regex.json"));
  console.log("\nImage files");
  console.log("# Apple Files", path.join(config.outAssetsPath, "apple/*"));
  console.log(
    "# Apple Spritesheet",
    path.join(config.outAssetsPath, "apple.png")
  );
  console.log("# Google Files", path.join(config.outAssetsPath, "google/*"));
  console.log(
    "# Google Spritesheet",
    path.join(config.outAssetsPath, "google.png")
  );
}

init();
