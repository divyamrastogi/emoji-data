const emojiData = require("emoji-datasource/emoji.json");
const emojilib = require("emojilib").lib;
const { find, uniq } = require("lodash");
const { getEmojiFromSearchPage } = require("./emojis");
const { getEmojiSearchPage } = require("./utils/http");
const { fixOrder } = require("./utils/misc");

const categoriesMap = {
  "Smileys & People": "people",
  "Animals & Nature": "nature",
  "Food & Drink": "food-drink",
  Activities: "activity",
  "Travel & Places": "travel-places",
  Objects: "objects",
  Symbols: "symbols",
  Flags: "flags"
};

function findMatch(emoji) {
  const first = emoji.codepoints[0];
  let unified = emoji.codepoints.join("-");

  if (first.length < 4) {
    unified = `${"0".repeat(4 - first.length)}${unified}`;
  }

  return emojiData.findIndex(i => i.unified === unified);
}

function findMatchInverse(emojiFromEmojiData, emojis) {
  let match;
  for (const [index, value] of emojis.entries()) {
    const matchIndex = findMatch(value);
    if (
      matchIndex > -1 &&
      emojiData[matchIndex].unified === emojiFromEmojiData.unified
    ) {
      match = index;
      break;
    }
  }
  return match;
}

async function getMissingEmojis(emojiDataMatches, emojis) {
  const newEmojis = [];
  const extraEmojiData = [];

  const isNewEmoji = emoji => {
    return (
      emojis.findIndex(e => e.id === emoji.id) === -1 &&
      newEmojis.findIndex(e => e.id === emoji.id) === -1
    );
  };

  for (const [index, value] of emojiData.entries()) {
    if (
      !emojiDataMatches.includes(index) &&
      value.short_name.indexOf("flag-") === -1 &&
      value.short_name.indexOf("skin-tone") === -1
    ) {
      extraEmojiData.push(value);
    }
  }

  for (const extraEmoji of extraEmojiData) {
    const searchPage = await getEmojiSearchPage(extraEmoji.short_name);
    const resultEmojis = await getEmojiFromSearchPage(
      searchPage,
      categoriesMap[extraEmoji.category]
    );

    for (const resultEmoji of resultEmojis) {
      if (isNewEmoji(resultEmoji)) {
        newEmojis.push(resultEmoji);
      }
    }
  }

  return newEmojis;
}

function fillLibsData(emoji) {
  const matchIndex = findMatch(emoji);
  if (matchIndex > -1) {
    const match = emojiData[matchIndex];
    const shortCodes = emoji.shortcodes.map(i =>
      i
        .toLowerCase()
        .replace(/[-_:]/g, " ")
        .trim()
    );
    for (const shortName of match.short_names) {
      if (
        !shortCodes.includes(
          shortName
            .toLowerCase()
            .replace(/[-_:]/g, " ")
            .trim()
        )
      ) {
        emoji.shortcodes.push(`:${shortName}:`);
      }
    }
  } else if (emoji.shortcodes.length === 0) {
    emoji.shortcodes.push(`:${emoji.id}:`);
  }

  emoji.shortcodes = uniq(emoji.shortcodes);
  emoji.aliases = uniq(emoji.aliases);

  if (emoji.shortcodes.includes(":+1:") || emoji.shortcodes.includes(":-1:")) {
    emoji.shortcodes.reverse();
  }

  for (const shortcode of emoji.shortcodes) {
    let clean = shortcode.replace(/:/g, "").replace(/-/g, "_");
    if (
      emojilib.hasOwnProperty(clean) &&
      emojilib[clean] &&
      emojilib[clean].keywords
    ) {
      const libEmoji = emojilib[clean];
      emoji.keywords = uniq([...emoji.keywords, ...libEmoji.keywords]);
    } else if (clean.indexOf("flag_") === 0) {
      const flagEmoji = find(emojilib, i =>
        i.keywords.includes(clean.substring(5))
      );
      if (flagEmoji) {
        emoji.keywords = uniq([...emoji.keywords, ...flagEmoji.keywords]);
      }
    }
  }

  return emoji;
}

function joinExtraEmojis(emojis, extraEmojis) {
  for (const extraEmoji of extraEmojis) {
    let inserted = false;
    const matchIndex = findMatch(extraEmoji);
    if (matchIndex > -1) {
      if (matchIndex > 0) {
        const previousIndex = findMatchInverse(
          emojiData[matchIndex - 1],
          emojis
        );
        if (previousIndex) {
          emojis.splice(previousIndex + 1, 0, extraEmoji);
          inserted = true;
        }
      }
      if (!inserted && matchIndex < emojiData.length - 1) {
        const nextIndex = findMatchInverse(emojiData[matchIndex + 1], emojis);
        if (nextIndex) {
          emojis.splice(nextIndex, 0, extraEmoji);
          inserted = true;
        }
      }
      if (!inserted) {
        emojis.push(extraEmoji);
      }
    }
  }
  return emojis;
}

async function addExternalEmojiData(emojis) {
  const emojiDataMatches = [];

  for (const emoji of emojis) {
    const matchIndex = findMatch(emoji);
    if (matchIndex > -1) {
      emojiDataMatches.push(matchIndex);
    }
  }

  const extraEmojis = await getMissingEmojis(emojiDataMatches, emojis);
  if (extraEmojis.length) {
    emojis = joinExtraEmojis(emojis, extraEmojis);
  }

  emojis = emojis.map(fillLibsData);
  emojis = fixOrder(emojis);

  return emojis;
}

module.exports = {
  addExternalEmojiData
};
