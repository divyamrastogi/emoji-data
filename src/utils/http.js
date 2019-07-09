const fs = require("fs");
const fetch = require("node-fetch");
const path = require("path");
const { resizeEmojiImages } = require("./misc");
const { get: getStore, set: setStore } = require("./store");
const { emojipediaUrl, tmpImagesPath } = require("../data/config");

const defaultOptions = {
  headers: {
    accept: "text/html",
    "accept-language": "en-US,en;q=0.9,en-GB;q=0.8,pt-BR;q=0.7,pt;q=0.6",
    "cache-control": "no-cache",
    pragma: "no-cache",
    "upgrade-insecure-requests": "1"
  },
  method: "GET",
  mode: "cors"
};

async function get(url, options = {}) {
  const fromStore = await getStore(url);
  if (fromStore) {
    return fromStore;
  }

  const res = await fetch(url, { ...defaultOptions, options });
  const text = await res.text();

  await setStore(url, text);
  return text;
}

async function getHomePage() {
  return get(emojipediaUrl);
}

async function getCategoryPage(urlPath) {
  return get(`${emojipediaUrl}${urlPath}`);
}

async function getEmojiPage(urlPath) {
  return get(`${emojipediaUrl}${urlPath}`);
}

async function getEmojiSearchPage(query) {
  const url = `${emojipediaUrl}/search/?q=${encodeURIComponent(query)}`;
  return get(url);
}

async function getEmojiImage(url, vendor, fileName) {
  const dir = path.join(tmpImagesPath, vendor);
  const filePath = path.join(dir, fileName);
  try {
    await fs.promises.mkdir(dir, { recursive: true });
  } catch {}

  try {
    await fs.promises.access(filePath, fs.constants.F_OK);
    await resizeEmojiImages(vendor, fileName);
    return;
  } catch {}

  const res = await fetch(url, { method: "GET", mode: "cors" });

  return new Promise(async (resolve, reject) => {
    const fileStream = fs.createWriteStream(filePath);
    res.body.pipe(fileStream);
    res.body.on("error", err => {
      reject(err);
    });
    fileStream.on("finish", async function() {
      await resizeEmojiImages(vendor, fileName);
      resolve();
    });
  });
}

module.exports = {
  getHomePage,
  getCategoryPage,
  getEmojiPage,
  getEmojiImage,
  getEmojiSearchPage
};
