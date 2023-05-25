const {
  login_qr_key,
  login_qr_create,
  login_qr_check,
  login_status,
  user_playlist,
  playlist_track_all,
  song_download_url,
} = require("NeteaseCloudMusicApi");
const fs = require("fs");
const download = require("download");
const qrcode = require("qrcode-terminal");
const path = require("path");

const HOME = process.env.HOME || process.env.USERPROFILE;

async function main() {
  try {
    if (!fs.existsSync("netease-cloud-music-cookie.txt")) {
      fs.writeFileSync("netease-cloud-music-cookie.txt", "");
    }
    let cookie = fs
      .readFileSync("netease-cloud-music-cookie.txt")
      .toString()
      .trim();
    if (cookie.length == 0) {
      let res = await login_qr_key();
      const qr_key = res.body.data.unikey;

      res = await login_qr_create({ key: qr_key, qrimg: true });

      // generate qrcode in terminal
      qrcode.generate(res.body.data.qrurl, (qrcode) => console.log(qrcode));

      for (; true; ) {
        res = await login_qr_check({
          key: qr_key,
        });
        if (res.body.code == 803) {
          break;
        }
      }
      cookie = res.body.cookie;
      // 写入cookie
      fs.writeFile("netease-cloud-music-cookie.txt", res.body.cookie);
    }

    // load user_id
    res = await login_status({ cookie: cookie });
    const user_id = res.body.data.account.id;

    // get user playlist
    res = await user_playlist({
      uid: user_id,
      limit: 200,
      offset: 0,
      cookie: cookie,
    });

    for (let list of res.body.playlist) {
      if (list.creator.userId != user_id) {
        continue;
      }
      res = await playlist_track_all({
        id: list.id,
        cookie: cookie,
      });

      for (let song of res.body.songs) {
        let singers = [];
        for (s of song.ar) singers.push(s.name);

        let songname = song.name + " - " + singers.join(",") + ".mp3";
        songname = songname.replace("/", " ").replace("\\", " ");

        res = await song_download_url({
          id: song.id,
          br: 128000,
          cookie: cookie,
        });
        if (!res.body.data.url) {
          console.log(songname, "无法获取下载链接");
          continue;
        }

        download(
          res.body.data.url,
          path.join(HOME, "Music", "NeteaseCloudMusic"),
          {
            filename: songname,
          }
        ).then(() => console.log(songname, " -------- Download Completed !"));
      }
    }
  } catch (error) {
    console.log(error);
  }
}

main();
