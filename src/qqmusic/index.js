const qqmusic = require("qq-music-api");
const list = require("./playlist.js");
const fs = require("fs");

qqmusic.setCookie(fs.readFileSync("qqmusic-cookie.txt").toString().trim());

async function main() {
  let lists = await list.getUserPlayList();

  lists.forEach((item) => {
    item.sync();
  });
}

main();
