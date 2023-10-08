const qqmusic = require("qq-music-api");
const list = require("./playlist.js");
const fs = require("fs");

class QQMusic {
  constructor(cookie) {
    qqmusic.setCookie(cookie);
  }
  getCookie = () => qqmusic.cookie;
  getUid = () => qqmusic.uin;

  // 同步用户歌单
  async syncUserPlayLists() {
    let lists = await list.getUserPlayList(this.getUid());

    lists.forEach((item) => {
      item.sync();
    });
  }

  // 每日推荐
  async dailyRecommend() {
    let res = await qqmusic
      .api("recommend/daily")
      .catch((err) => console.log("recommend-daily", err));

    res = await list.getPlayList(res.disstid);

    if (fs.existsSync(res.listpath))
      fs.rmSync(res.listpath, { recursive: true });

    res.sync();
  }
}

// 实例化并导出
module.exports = new QQMusic(
  fs.readFileSync("qqmusic-cookie.txt").toString().trim(),
);
