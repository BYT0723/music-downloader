# music-downloader

Synchronize your qq music playlist to local, and generate playlist for mpd

### Configuration

The configuration items are all in `src/qqmusic.js`

```javascript
// song storage path
const SongDir = "<path>";
// Lyric storage path
const SongLyricDir = "<path>";
// The name of the daily recommended playlist
const RecommendDailyDir = "每日推荐";
// Whether to synchronize the playlist of mpd
const syncMpdPlayList = true;
// If the playlist with the same name exists, whether to overwrite it
const overwritePlayList = true;
// Path of mpd playlists
const MpdPlayListsPath = "<path>/<playlists>";
// When a playlist with the same name appears, the old file will be backed up to this path
const MpdPlayListsBackupPath = "<paht>/<playlists>/.old";
```

### Start

```shell
npm i

# add your qqmusic cookie to root/qqmusic-cookie.txt
echo "key=value;..." > qqmusic-cookie.txt

# download myself playlists
node src/main.js download

# if your want to download other user's list can add target uid
node src/main.js download <qq_uid>

# Download the daily recommended playlist
node src/main.js recommend-daily
```
