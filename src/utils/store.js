const fs = require("fs").promises;
const path = require("path");
const { tmpPagesPath, outDataPath } = require("../data/config");

function getFilePath(name) {
  return path.join(tmpPagesPath, `./${JSON.stringify(name).replace(/\W/g, "")}`);
}

async function get(name) {
  const filePath = getFilePath(name);
  let file;
  try {
    file = await fs.readFile(filePath, { encoding: "utf8" });
  } catch {}
  return file;
}

async function set(name, data) {
  const filePath = getFilePath(name);
  try {
    await fs.writeFile(filePath, data);
  } catch (e) {
    console.error(e);
  }
}

async function saveOutput(name, data) {
  const filePath = path.join(outDataPath, name);
  try {
    await fs.writeFile(filePath, JSON.stringify(data));
  } catch (e) {
    console.error(e);
  }
}

module.exports = {
  get,
  set,
  saveOutput
};
