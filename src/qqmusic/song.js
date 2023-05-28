const qqmusic = require("qq-music-api");
const download = require("download");
const fs = require("fs");
const path = require("path");

// 默认的歌曲品质
const SongSize = "128"; // 128,320,flac
// 是否优先高品质
const SongSizeHigh = false;

// 转换品质和后缀名
const sizeToSuffix = (size) =>
  ["320", "128"].indexOf(size) >= 0 ? "mp3" : size;

class Song {
  constructor(
    mid,
    id = null,
    name = null,
    singer = null,
    size = null,
    filename = null,
    lyricname = null,
    translyricname = null
  ) {
    this.id = id;
    this.mid = mid;
    this.name = name;
    this.singer = singer;
    this.size = size;
    this.filename = filename;
    this.lyricname = lyricname;
    this.translyricname = translyricname;
  }

  // 下载歌曲
  async download(listpath) {
    if (!this.filename) {
      console.log("Song is not initialized");
      return;
    }

    if (fs.existsSync(path.join(listpath, this.filename))) return;
    try {
      let res = await qqmusic.api("/song/url", {
        id: this.mid,
        type: this.size,
      });
      download(res, listpath, {
        filename: this.filename,
      }).then(() => console.log(this.filename, "Download Completed !"));
    } catch (err) {
      console.log(this.filename, err);
    }
  }

  // 下载歌词
  async downloadLyric(lyricpath) {
    if (!fs.existsSync(lyricpath)) fs.mkdirSync(lyricpath);
    try {
      const res = await qqmusic.api("lyric", { songmid: this.mid });

      let lyricfile = path.join(lyricpath, this.lyricname);
      if (!fs.existsSync(lyricfile)) {
        // 下载歌词
        res.lyric = res.lyric
          .replace(/&apos;/g, "'")
          .replace(/&quot;/g, '"')
          .replace(/&nbsp;/g, " ");
        fs.writeFile(lyricfile, res.lyric, (err) => {
          if (err != null) console.log(lyricfile, err);
          else console.log(this.lyricname, "Download Completed !");
        });
      }
      // 下载歌词翻译
      if (res.trans != "") {
        let lyrictrans = path.join(lyricpath, this.translyricname);
        if (!fs.existsSync(lyrictrans)) {
          res.lyric = res.lyric
            .replace(/&apos;/g, "'")
            .replace(/&quot;/g, '"')
            .replace(/&nbsp;/g, " ");
          fs.writeFile(lyrictrans, res.trans, (err) => {
            if (err != null) console.log(lyrictrans, err);
            else console.log(this.translyricname, "Download Completed !");
          });
        }
      }
    } catch (err) {
      console.log(this.lyricname, err);
    }
  }
}

// 解析songlist接口中的result.songlist数组中的item
// 并生成Song
function parse(song) {
  let singers = [];
  for (s of song.singer) singers.push(s.name);

  let songsize = SongSize;
  if (SongSizeHigh)
    if (song.sizeflac != 0) songsize = "flac";
    else if (song.size320 != 0) songsize = "320";

  let songname = song.songname.replace("/", " ").replace("\\", " ");
  let singer = singers.join();
  return new Song(
    song.songmid,
    song.songid,
    songname,
    singer,
    songsize,
    songname + " - " + singer + "." + sizeToSuffix(songsize),
    songname + " - " + singer + ".lrc",
    songname + " - " + singer + ".trans.lrc"
  );
}

// 通过mid获取Song
async function getSong(mid) {
  let res = await qqmusic.api("/song", { songmid: mid });

  let singers = [];
  for (s of res.track_info.singer) singers.push(s.title);

  let songsize = SongSize;
  if (SongSizeHigh)
    if (res.track_info.file.size_flac != 0) songsize = "flac";
    else if (res.track_info.file.size_320mp3 != 0) songsize = "320";

  let songname = res.track_info.title.replace("/", " ").replace("\\", " ");
  let singer = singers.join();
  return new Song(
    res.track_info.id,
    res.track_info.mid,
    songname,
    singer,
    songsize,
    songname + " - " + singer + "." + sizeToSuffix(songsize),
    songname + " - " + singer + ".lrc",
    songname + " - " + singer + ".trans.lrc"
  );
}

module.exports = {
  Song: Song,
  getSong: getSong,
  parse: parse,
};
