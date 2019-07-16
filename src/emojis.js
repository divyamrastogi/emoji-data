const cheerio = require("cheerio");
const { emojipediaUrl } = require("./data/config");
const duplicates = require("./data/duplicates");
const emoticons = require("./data/emoticons");
const { getEmojiPage, getEmojiImage } = require("./utils/http");
const { getIdFromUrl } = require("./utils/misc");

function getEmojiNameAndNative($) {
  const $h1 = $("body .container .content article")
    .find("h1")
    .first();
  const native = $h1
    .children()
    .first()
    .text()
    .trim();
  const name = $h1
    .text()
    .replace(native, "")
    .trim();
  return { name, native };
}

function getEmojiAliases($) {
  const aliases = [];
  const $ul = $("body .container .content article section.aliases")
    .find("ul")
    .first();
  $ul.children().each(function() {
    const text = $(this).text();
    aliases.push(text.slice(text.indexOf(" ") + 1).trim());
  });
  return aliases;
}

function getEmojiCodepoints($) {
  const codepoints = [];
  let $ul;
  $("h2").each(function() {
    const $this = $(this);
    const text = $this.text();
    if (text.toLowerCase() === "codepoints") {
      $ul = $this.next();
      return false;
    }
  });

  if ($ul && $ul.children().length) {
    $ul.children().each(function() {
      const text = $(this)
        .children()
        .first()
        .text();
      if (text) {
        codepoints.push(text.slice(text.indexOf("U+") + 2));
      }
    });
  }
  return codepoints;
}

function getEmojiShortcodes($) {
  const shortcodes = [];
  const $ul = $("body .container .content article ul.shortcodes").first();
  if ($ul && $ul.children().length) {
    $ul.children().each(function() {
      const text = $(this)
        .text()
        .trim();
      if (text) {
        shortcodes.push(text);
      }
    });
  }
  return shortcodes;
}

function getEmojiEmoticons(id) {
  const result = [];
  for (const e in emoticons) {
    if (emoticons.hasOwnProperty(e) && emoticons[e] === id) {
      result.push(e);
    }
  }
  return result;
}

function getEmojiSkinsUrls($, id, name) {
  const checkById = duplicates.bySkins.includes(id);
  const skins = [];
  let $ul;
  $("h2").each(function() {
    const $this = $(this);
    const text = $this.text();
    if (text.toLowerCase() === "related") {
      $ul = $this.next();
      return false;
    }
  });

  if ($ul && $ul.children().length) {
    let count = 0;
    $ul.children().each(function() {
      if (count >= 5) {
        return false;
      }
      const $this = $(this);
      const $a = $this.find("a").first();
      const text = $a.text().toLowerCase();
      const url = $a.attr("href");
      if (text && url && text.indexOf("skin tone") > -1) {
        if (
          (!checkById && text.indexOf(name.toLowerCase()) > -1) ||
          (checkById && url.startsWith(`/${id}`))
        ) {
          skins.push(url);
          count++;
        }
      }
    });
  }
  return skins;
}

async function getEmojiSkins(urls, parentEmoji) {
  const skins = [];
  if (urls.length) {
    for (const url of urls) {
      const id = getIdFromUrl(url);
      const page = await getEmojiPage(url);
      const data = await getEmojiPageData(
        page,
        { id, order: parentEmoji.order, categoryId: parentEmoji.categoryId },
        true
      );

      if (!data) {
        continue;
      }

      skins.push(data);
    }
  }
  return skins;
}

function getEmojiImagesUrls($) {
  const images = [];
  const $ul = $(
    "body .container .content article section.vendor-list ul"
  ).first();
  if ($ul && $ul.children().length) {
    $ul.children().each(function() {
      const $container = $(this)
        .find(".vendor-container")
        .first();
      const vendor = $container
        .find(".vendor-info h2 a")
        .first()
        .text()
        .trim()
        .toLowerCase();

      let url;
      const $img = $container.find(".vendor-image img").first();

      if (vendor === "apple") {
        url = $img.attr("src");
      } else if (vendor === "google") {
        url = $img.attr("srcset");
        if (url) {
          url = url.slice(0, url.indexOf(" "));
        }
      }

      if (url) {
        images.push({
          vendor,
          url
        });
      }
    });
  }
  return images;
}

async function getEmojiImages(urls, emoji) {
  const vendors = [];
  const fileName = `${emoji.codepoints.join("-")}.png`;
  if (urls.length) {
    for (const { vendor, url } of urls) {
      try {
        await getEmojiImage(url, vendor, fileName);
        vendors.push(vendor);
      } catch (e) {
        console.error(e);
      }
    }
  }

  if (vendors.includes("apple") && vendors.includes("google")) {
    return fileName;
  }
}

async function getEmojiPageData(
  page,
  { id, order, categoryId },
  isSkin = false
) {
  if (page) {
    const $ = cheerio.load(page);
    const { name, native } = getEmojiNameAndNative($);
    const emoji = {
      id,
      name,
      native,
      categoryId,
      order,
      aliases: getEmojiAliases($),
      codepoints: getEmojiCodepoints($),
      shortcodes: getEmojiShortcodes($),
      emoticons: getEmojiEmoticons(id),
      keywords: []
    };

    const imagesUrls = getEmojiImagesUrls($);
    const fileName = await getEmojiImages(imagesUrls, emoji);

    if (fileName) {
      emoji.image = fileName;
    } else {
      return;
    }

    console.log(emoji.native, `${emojipediaUrl}/${emoji.id}`);

    if (!isSkin) {
      const skinsUrls = getEmojiSkinsUrls($, id, name);
      const skins = await getEmojiSkins(skinsUrls, emoji);
      emoji.skins = skins;
      if (skins.length) {
        emoji.hasSkins = true;
      }
    }

    return emoji;
  }
}

async function getEmojiFromSearchPage(page, categoryId) {
  const emojisUrl = [];
  const emojis = [];

  if (page) {
    const $ = cheerio.load(page);
    const $results = $("body .container .content .search-results").first();
    if ($results && $results.children().length) {
      $results.children().each(function() {
        if (
          $(this)
            .find("p")
            .first()
            .text()
            .indexOf("No results found") > -1
        ) {
          return false;
        }

        emojisUrl.push(
          $(this)
            .find("h2 a")
            .first()
            .attr("href")
        );
      });

      if (emojisUrl.length) {
        for (const emojiUrl of emojisUrl) {
          const emojiId = getIdFromUrl(emojiUrl);
          const emojiPage = await getEmojiPage(emojiUrl);
          const emojiData = await getEmojiPageData(emojiPage, {
            id: emojiId,
            order: 0,
            categoryId
          });

          if (!emojiData) {
            continue;
          }

          emojis.push(emojiData);
        }
      }
    }
  }

  return emojis;
}

module.exports = {
  getEmojiPageData,
  getEmojiFromSearchPage
};
