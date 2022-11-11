# qqmusic-script

Used to download songs in your own playlist in QQ Music

# Start

```shell
npm -g install

# add your qqmusic cookie to root/qqmusic-cookie.txt
echo "key=value;..." > qqmusic-cookie.txt

node src/main.js download
# if your want to download other user's list can add target uid
node src/main.js download 1151713063
```
