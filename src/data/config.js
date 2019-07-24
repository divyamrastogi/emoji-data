const path = require("path");

const tmpPath = path.resolve(__dirname, "../../tmp");

module.exports = {
  emojipediaUrl: "https://emojipedia.org",
  emojiSize: 152,
  emojiSpriteSize: 40,
  outDataPath: path.resolve(__dirname, "../../data"),
  outAssetsPath: path.resolve(__dirname, "../../images"),
  tmpPagesPath: path.join(tmpPath, "net", "pages"),
  tmpImagesPath: path.join(tmpPath, "net", "images"),
  tmpPath
};
