const fs = require("fs");
const download = require("download");
const qqmusic = require("qq-music-api");

const SongDir = "/home/walter/Music/mpd/";
const SongLyricDir = "/home/walter/Music/mpd/.lyrics/";

qqmusic.setCookie(fs.readFileSync("qqmusic-cookie.txt").toString().trim());

function DownloadSong(song) {
  qqmusic
    .api("/song/url", {
      id: song.mid,
      mediaId: song.strMediaMid,
    })
    .then((res) => {
      if (fs.existsSync(song.listpath + song.filename)) return;
      download(res, song.listpath, { filename: song.filename }).end(() =>
        console.log(song.filename, "Download Completed !")
      );
    })
    .catch((err) => console.log(song.filename, ":", err));
}
function DownloadSongLyrics(song) {
  qqmusic
    .api("lyric", {
      songmid: song.mid,
    })
    .then((res) => {
      if (fs.existsSync(SongLyricDir + song.lyricname)) return;
      if (fs.existsSync(SongLyricDir + song.translyricname)) return;

      let callback = (err) => {
        if (err != null) console.log(song.lyricname, ":", err);
      };
      fs.writeFile(SongLyricDir + song.lyricname, res.lyric, callback);
      if (res.trans != "")
        fs.writeFile(SongLyricDir + song.translyricname, res.trans, callback);
    })
    .catch((err) => console.log(err));
}

async function DownloadUserSongList(id) {
  if (!fs.existsSync(SongDir)) fs.mkdirSync(SongDir);
  if (!fs.existsSync(SongLyricDir)) fs.mkdirSync(SongLyricDir);

  let res = await qqmusic
    .api("user/songlist", { id: id })
    .catch((err) => console.log("获取歌单：", err));

  for (list of res.list) {
    if (list.tid == 0) continue;

    res = await qqmusic
      .api("songlist", { id: list.tid })
      .catch((err) => console.log("获取歌单详情：", err));

    let listpath = SongDir + res.dissname + "/";
    if (!fs.existsSync(listpath)) fs.mkdirSync(listpath);

    for (let song of res.songlist) {
      let singers = [];
      for (s of song.singer) singers.push(s.name);

      let songname = song.songname.replace("/", " ");
      let singer = singers.join();
      let payload = {
        mid: song.songmid,
        strMediaMid: song.strMediaMid,
        name: songname,
        singer: singer,
        listpath: listpath,
        filename: songname + " - " + singer + ".mp3",
        lyricname: songname + " - " + singer + ".lrc",
        translyricname: songname + " - " + singer + ".trans.lrc",
      };
      DownloadSong(payload);
      DownloadSongLyrics(payload);
    }
  }
}

async function Search(key) {
  let res = await qqmusic
    .api("search/quick", { key: key })
    .catch((err) => console.log("Search", err));

  // album;
  // mv;
  // singer;
  // song;

  for (let singer of res.singer.itemlist) {
    console.log(singer);
  }
  for (let song of res.song.itemlist) {
    console.log(song);
  }
}

async function Recommend() {
  let res = await qqmusic.api("recommend/daily");
  console.log(res.songlist);
}

let opt = process.argv.slice(2)[0]; //获取控制台参数
let arg = process.argv.slice(2)[1];
console.log(opt, arg);
switch (opt) {
  case "search":
    Search(arg);
    break;
  case "download":
    if (arg == undefined || arg == "") arg = qqmusic.uin;
    DownloadUserSongList(arg);
    break;
  default:
    Recommend();
    break;
}
