const cheerio = require("cheerio");

function getHomePageCategoriesUrl(page) {
  const categories = [];

  if (page) {
    const $ = cheerio.load(page);

    let $ul;
    $("h2").each(function() {
      const $this = $(this);
      const text = $this.text();
      if (text.toLowerCase() === "categories") {
        $ul = $this.next();
        return false;
      }
    });

    if ($ul && $ul.children().length) {
      $ul.children().each(function() {
        const $a = $(this)
          .children()
          .first();
        categories.push($a.attr("href"));
      });
    }
  }

  return categories;
}

function getCategoryPageData(page) {
  if (page) {
    const $ = cheerio.load(page);
    const $h1 = $("body .container .content")
      .find("h1")
      .first();
    const $p = $h1.next();

    const emojiIcon = $h1
      .children()
      .first()
      .text()
      .trim();
    const name = $h1
      .text()
      .replace(emojiIcon, "")
      .trim();
    const pText = $p.text();

    return {
      name
    }
  }
}

function getCategoryPageEmojisUrl(page) {
  const emojis = [];

  if (page) {
    const $ = cheerio.load(page);
    const $ul = $(".emoji-list").first();
    $ul.children().each(function() {
      emojis.push(
        $(this)
          .children()
          .first()
          .attr("href")
      );
    });
  }

  return emojis;
}

module.exports = {
  getHomePageCategoriesUrl,
  getCategoryPageData,
  getCategoryPageEmojisUrl
};
