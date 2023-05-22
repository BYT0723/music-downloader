const fs = require("fs");
const path = require("path");
const download = require("download");
const qqmusic = require("qq-music-api");

const HOME = process.env.HOME || process.env.USERPROFILE;

// const SongSize = ["flac", "320", "128", "ape", "m4a"];
const SongSize = ["128", "320", "flac"];
const sizeToSuffix = (size) =>
  ["320", "128"].indexOf(size) >= 0 ? "mp3" : size;

// song storage path (default: ~/Music)
const SongDir = path.join(HOME, "Music");
// Lyric storage path (default: ~/Music/.lyrics)
const SongLyricDir = path.join(SongDir, ".lyrics");
// The name of the daily recommended playlist
const RecommendDailyDir = "每日推荐";
// Whether to synchronize the playlist of mpd
const syncMpdPlayList = true;
// If the playlist with the same name exists, whether to overwrite it
const overwritePlayList = true;
// Path of mpd playlists (default: ~/.mpd/playlists)
const MpdPlayListsPath = path.join(HOME, ".mpd", "playlists");
// When a playlist with the same name appears, the old file will be backed up to this path (default: ~/.mpd/playlists/.old)
const MpdPlayListsBackupPath = path.join(MpdPlayListsPath, ".old");

qqmusic.setCookie(fs.readFileSync("qqmusic-cookie.txt").toString().trim());

// Download single song
async function DownloadSong(song) {
  console.log(song.mid, song.name);
  let songfile = path.join(song.listpath, song.filename);
  if (fs.existsSync(songfile)) return;
  try {
    let res = await qqmusic.api("/song/url", {
      id: song.mid,
      type: song.size,
      mediaId: song.strMediaMid,
    });
    download(res, song.listpath, { filename: song.filename }).then(() =>
      console.log(song.filename, "Download Completed !")
    );
  } catch (err) {
    console.log(song.filename, err);
    // TryDownloadNextSizeSong(song, err)
  }
}

function TryDownloadNextSizeSong(song, err) {
  let current = SongSize.indexOf(song.size);
  if (current < SongSize.length - 1) {
    let nextSize = SongSize[current + 1];
    let nextFilename = song.filename.replace(song.size, sizeToSuffix(nextSize));
    (song.filename = nextFilename), (song.size = nextSize);
    DownloadSong(song);
  } else {
    console.log(song.filename, ":", err);
  }
}

// Download lyric and translation of lyric
async function DownloadSongLyric(song) {
  let lyricfile = path.join(SongLyricDir, song.lyricname);
  let lyrictrans = path.join(SongLyricDir, song.translyricname);
  if (fs.existsSync(lyricfile)) return;
  if (fs.existsSync(lyrictrans)) return;
  try {
    const res = await qqmusic.api("lyric", { songmid: song.mid });

    // download lyric
    res.lyric = res.lyric.replace("&apos;", "'");
    fs.writeFile(lyricfile, res.lyric, (err) => {
      if (err != null) console.log(song.lyricname, err);
      else console.log(song.lyricname, "Download Completed !");
    });
    // download lyrics translation
    if (res.trans != "") {
      res.trans = res.trans.replace("&apos;", "'");
      fs.writeFile(lyrictrans, res.trans, (err) => {
        if (err != null) console.log(song.translyricname, err);
        else console.log(song.translyricname, "Download Completed !");
      });
    }
  } catch (err) {
    console.log(song.lyricname, err);
  }
}

function DownloadSongList(listname, songlist) {
  let listpath = path.join(SongDir, listname);
  if (!fs.existsSync(listpath)) fs.mkdirSync(listpath);

  // MPD Extension
  let playListPath = path.join(MpdPlayListsPath, listname + ".m3u");
  let oldPlayListPath = path.join(
    MpdPlayListsBackupPath,
    listname + "_old.m3u"
  );
  if (syncMpdPlayList) {
    if (!fs.existsSync(MpdPlayListsPath)) fs.mkdirSync(MpdPlayListsPath);
    if (!overwritePlayList && fs.existsSync(playListPath)) {
      if (!fs.existsSync(MpdPlayListsBackupPath))
        fs.mkdirSync(MpdPlayListsBackupPath);
      else fs.rmSync(oldPlayListPath);
      fs.renameSync(playListPath, oldPlayListPath);
    }
    fs.writeFileSync(playListPath, "", (err) =>
      console.log("mpd playlist create failed:", err)
    );
  }

  for (let song of songlist) {
    let singers = [];
    for (s of song.singer) singers.push(s.name);

    let songsize = SongSize[0];
    let songname = song.songname.replace("/", " ").replace("\\", " ");
    let singer = singers.join();
    let payload = {
      mid: song.songmid,
      strMediaMid: song.strMediaMid,
      name: songname,
      singer: singer,
      size: songsize,
      listpath: listpath,
      filename: songname + " - " + singer + "." + sizeToSuffix(songsize),
      lyricname: songname + " - " + singer + ".lrc",
      translyricname: songname + " - " + singer + ".trans.lrc",
    };
    // MPD Extension
    if (syncMpdPlayList) {
      fs.appendFileSync(
        playListPath,
        listname + "/" + payload.filename + "\n",
        (err) => console.log("mpd playlist append failed:", err)
      );
    }
    DownloadSong(payload);
    DownloadSongLyric(payload);
  }
}

// Download the user's playlist
async function DownloadUserSongList(uid) {
  if (!fs.existsSync(SongDir)) fs.mkdirSync(SongDir);
  if (!fs.existsSync(SongLyricDir)) fs.mkdirSync(SongLyricDir);

  try {
    let res = await qqmusic.api("user/songlist", { id: uid });
    for (list of res.list) {
      if (list.tid == 0) continue;

      let result = await qqmusic.api("songlist", { id: list.tid });

      DownloadSongList(result.dissname, result.songlist);
    }
  } catch (err) {
    console.log("获取歌单", err);
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

// daily recommendations
async function RecommendDaily() {
  let res = await qqmusic
    .api("recommend/daily")
    .catch((err) => console.log(RecommendDailyDir, err));

  let listpath = path.join(SongDir, RecommendDailyDir);
  let datefile = path.join(listpath, ".date");
  if (!fs.existsSync(listpath)) {
    fs.mkdirSync(listpath);
  } else {
    if (fs.existsSync(datefile)) {
      let date = new Date(fs.readFileSync(datefile).toString());
      let now = new Date();

      // 时间相同表示当日已经更新
      if (date.getDay() != now.getDay()) {
        fs.rmSync(listpath, { force: true, recursive: true });
        fs.mkdirSync(listpath);
      }
    } else {
      fs.mkdirSync(listpath);
    }
  }

  DownloadSongList(RecommendDailyDir, res.songlist);

  let now = new Date();
  fs.writeFile(datefile, now.toString(), (err) => console.log(err));
}

let opt = process.argv.slice(2)[0]; //获取控制台参数
let arg = process.argv.slice(2)[1];
switch (opt) {
  case "search":
    Search(arg);
    break;
  case "download":
    if (arg == undefined || arg == "") arg = qqmusic.uin;
    DownloadUserSongList(arg);
    break;
  case "recommend-daily":
    RecommendDaily();
    break;
}
