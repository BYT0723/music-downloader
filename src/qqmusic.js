const qqmusic = require("./qqmusic/");

let opt = process.argv.slice(2)[0]; //获取控制台参数
let arg = process.argv.slice(2)[1];
switch (opt) {
  case "search":
    Search(arg);
    break;
  case "sync-self":
    qqmusic.syncUserPlayLists();
    break;
  case "daily-recommend":
    qqmusic.dailyRecommend();
    break;
}
