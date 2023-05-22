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
const MpdPlayListsBackupPath = "<path>/<playlists>/.old";
```

### Start

```shell
npm i

# add your qqmusic cookie to root/qqmusic-cookie.txt or copy cookie to qqmusic-cookie.txt from browser
echo "key=value;..." > qqmusic-cookie.txt

# sync myself playlists
npm run sync

# Download the daily recommended playlist
npm run daily
```
