const qqmusic = require("qq-music-api");
const path = require("path");
const fs = require("fs");
const Song = require("./song.js").Song;
const parseSong = require("./song.js").parse;

// 家目录
const HOME = process.env.HOME || process.env.USERPROFILE;

// 歌曲存储目录(若同步mpd,建议与mpd.conf中的music_directory相同)
const SongDir = path.join(HOME, "Music");
// 歌词存储目录
const SongLyricDir = path.join(SongDir, ".lyrics");
// 是否同步MPD歌单
const SyncMpdPlayList = true;
// 同步时是否覆盖MPD歌单
const OverwritePlayList = true;
// mpd歌单存储目录(建议与mpd.conf中的playlist_directory相同)
const MpdPlayListsPath = path.join(HOME, ".mpd", "playlists");
// 同步时，若不覆盖，则备份到以下路径中
const MpdPlayListsBackupPath = path.join(MpdPlayListsPath, ".old");

class PlayList {
  constructor(tid, dirid, dissname, songs = null) {
    this.tid = tid;
    this.dirid = dirid;
    // 歌单名称
    this.dissname = dissname;
    // 歌单目录路径
    this.listpath = path.join(SongDir, this.dissname);
    // 歌单信息路径
    this.listInfoPath = path.join(SongDir, this.dissname, ".info.json");
    // 歌单歌词路径
    this.lyricpath = SongLyricDir;

    if (!fs.existsSync(this.listpath)) fs.mkdirSync(this.listpath);

    // 同步的mpd歌单路径
    if (!fs.existsSync(MpdPlayListsPath)) fs.mkdirSync(MpdPlayListsPath);
    this.mpdPlayListPath = path.join(MpdPlayListsPath, this.dissname + ".m3u");

    // 备份的mpd歌单路径
    if (!fs.existsSync(MpdPlayListsBackupPath))
      fs.mkdirSync(MpdPlayListsBackupPath);
    this.oldMpdPlayListPath = path.join(
      MpdPlayListsBackupPath,
      this.dissname + ".m3u"
    );

    // 歌曲数组初始化
    if (!songs) this.songs = new Array();
    else this.songs = songs;

    // 初始化ListInfo
    this.listInfo = {
      tid: this.tid,
      dirid: this.dirid,
      dissname: this.dissname,
      id: {},
      mid: {},
    };
    this.songs.forEach((item) => {
      this.listInfo.id[item.filename] = item.id;
      this.listInfo.mid[item.filename] = item.mid;
    });
  }

  // 同步歌单
  async sync() {
    for (let item of this.songs) {
      // 同步mpd歌单
      if (SyncMpdPlayList) this.syncMpdPlayList();
      // 下载歌词
      await item.downloadLyric(this.lyricpath);
      // 下载歌曲
      await item.download(this.listpath);
    }
    // 同步listInfo
    fs.writeFileSync(this.listInfoPath, JSON.stringify(this.listInfo, null, 2));
  }

  syncByListInfo() {
    //如果为每日推荐则不同步
    if (info.dirid == 202) {
      console.log("每日推荐歌单不能增删同步");
      return;
    }

    let info = JSON.parse(fs.readFileSync(this.listInfoPath).toString());

    let addList = Object.entries(info.mid)
      .filter((value) => info.id[value[0]] == null)
      .map((value) => value[1]);
    let rmList = Object.entries(info.id)
      .filter((value) => info.mid[value[0]] == null)
      .map((value) => value[1]);

    if (addList.length > 0) this.addSong(addList.join(","));
    else if (rmList.length > 0) this.rmSong(rmList.join(","));
    else return;

    this.sync();
  }

  // 检查mpd歌单中是否有其他歌单中的歌
  checkMpdPlayList() {}

  // 向歌单中添加歌曲
  addSong(mid) {
    qqmusic
      .api("/songlist/add", { dirid: this.dirid, mid: mid })
      .catch((err) =>
        console.log("failed to add song(" + mid + ") to", this.dissname, err)
      );
  }

  // 从歌单中移除歌曲
  rmSong(id) {
    qqmusic
      .api("/songlist/remove", { dirid: this.dirid, id: id })
      .catch((err) =>
        console.log(
          "failed to remove song(" + id + ") from",
          this.dissname,
          err
        )
      );
  }

  // 同步mpd歌单
  syncMpdPlayList() {
    // 不覆盖并且mpd歌单存在时
    if (fs.existsSync(this.mpdPlayListPath)) {
      if (OverwritePlayList) fs.writeFileSync(this.mpdPlayListPath, "");
      else fs.renameSync(this.mpdPlayListPath, this.oldMpdPlayListPath);
    }

    // 遍历songs,并生成mpd歌单
    this.songs.forEach((item) => {
      fs.appendFileSync(
        this.mpdPlayListPath,
        this.dissname + "/" + item.filename + "\n",
        (err) => console.log("mpd playlist append failed:", err)
      );
    });
  }
}

// 使用tid获取playlist
async function getPlayList(tid) {
  let res = await qqmusic.api("songlist", { id: tid });
  let songs = new Array();
  for (let item of res.songlist) {
    let song = parseSong(item);
    songs.push(song);
  }
  return new PlayList(tid, res.dirid, res.dissname, songs);
}

// 使用uid获取playlist
async function getUserPlayList(uid) {
  let lists = new Array();
  try {
    let res = await qqmusic.api("user/songlist", { id: uid });
    for (let list of res.list.filter((item) => item.song_cnt != 0)) {
      let item = await getPlayList(list.tid);
      lists.push(item);
    }
  } catch (err) {
    console.log("获取歌单", err);
  }
  return lists;
}

module.exports = {
  PlayList: PlayList,
  getPlayList: getPlayList,
  getUserPlayList: getUserPlayList,
};
