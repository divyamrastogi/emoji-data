module.exports = {
  // 0 - emojiId that will be removed
  // 1 - if it belongs to this categoryId
  byCategories: [
    ["umbrella", "people"],
    ["mushroom", "food-drink"],
    ["chestnut", "nature"],
    ["man-in-business-suit-levitating", "activity"],
    ["person-in-lotus-position", "activity"],
    ["spool-of-thread", "people"],
    ["spool-of-thread", "activity"],
    ["ball-of-yarn", "people"],
    ["ball-of-yarn", "activity"],
    ["rowboat", "travel-places"],
    ["shooting-star", "nature"],
    ["luggage", "people"],
    ["umbrella-on-ground", "objects"],
    ["banknote-with-yen-sign", "travel-places"],
    ["banknote-with-dollar-sign", "travel-places"],
    ["banknote-with-euro-sign", "travel-places"],
    ["banknote-with-pound-sign", "travel-places"],
    ["moyai", "objects"],
    ["white-flower", "nature"],
    ["barber-pole", "symbols"],
    ["postal-horn", "symbols"],
    ["potable-water-symbol", "symbols"]
  ],

  // 0 - emojiId that will be removed
  // 1 - emojiId that will get above's emoji shortcodes
  byGenders: [
    ["construction-worker", "male-construction-worker"],
    ["guardsman", "male-guard"],
    ["sleuth-or-spy", "male-sleuth"],
    ["police-officer", "male-police-officer"],
    ["person-frowning", "woman-frowning"],
    ["person-with-pouting-face", "woman-pouting"],
    ["information-desk-person", "woman-tipping-hand"],
    ["happy-person-raising-one-hand", "woman-raising-hand"],
    ["person-bowing-deeply", "man-bowing-deeply"],
    ["person-in-lotus-position", "woman-in-lotus-position"],
    ["person-climbing", "woman-climbing"],
    ["person-with-ball", "man-with-ball"],
    ["person-doing-cartwheel", "man-doing-cartwheel"],
    ["face-with-no-good-gesture", "woman-gesturing-not-ok"],
    ["face-with-ok-gesture", "woman-gesturing-ok"],
    ["shrug", "woman-shrugging"],
    ["man-with-turban", "man-wearing-turban"],
    ["face-massage", "woman-getting-face-massage"],
    ["haircut", "woman-getting-haircut"],
    ["pedestrian", "man-walking"],
    ["runner", "man-running"],
    ["golfer", "man-golfing"],
    ["surfer", "man-surfing"],
    ["rowboat", "man-rowing-boat"],
    ["swimmer", "man-swimming"],
    ["weight-lifter", "man-weight-lifting"],
    ["bicyclist", "man-biking"],
    ["mountain-bicyclist", "man-mountain-biking"],
    ["water-polo", "man-playing-water-polo"],
    ["juggling", "man-juggling"],
    ["women-with-bunny-ears-partying", "woman-with-bunny-ears"],
    ["person-with-blond-hair", "blond-man"],
    ["superhero", "woman-superhero"],
    ["fairy", "woman-fairy"],
    ["vampire", "woman-vampire"],
    ["kiss", "kiss-woman-man"],
    ["family", "family-man-woman-boy"]
  ],

  // When checking for skin variations, the default is to compare emoji names.
  // However, these emojis require id comparison instead.
  bySkins: [
    "bearded-person",
    "blond-man",
    "blonde-woman",
    "man-bald",
    "man-curly-haired",
    "man-dancing",
    "man-red-haired",
    "man-white-haired",
    "woman-bald",
    "woman-curly-haired",
    "woman-red-haired",
    "woman-white-haired"
  ],

  // Some gender neutral emoji will show different genders depending on the vendor.
  // This is not being used yet. First, I need to figure what to do.
  // 0 - neutral emoji
  // 1 - apple emoji
  // 2 - google emoji
  byVendor: [
    ["face-palm", "man-facepalming", "woman-facepalming"],
    ["supervillain", "woman-supervillain", "man-supervillain"],
    ["merperson", "merman", "merwoman"],
    ["elf", "man-elf", "woman-elf"],
    ["genie", "man-genie", "woman-genie"],
    ["zombie", "man-zombie", "woman-zombie"],
    ["person-in-steamy-room", "man-in-steamy-room", "woman-in-steamy-room"],
    ["wrestlers", "women-wrestling", "men-wrestling"],
    ["handball", "woman-playing-handball", "man-playing-handball"]
  ]
};
