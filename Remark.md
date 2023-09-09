## 测试

播放错误，重连测试：

```sh
## 找到ffmpeg进程
ps aux|grep ffmpeg

## 断掉进程
kill -9 xxxx

## 重新推流
ffmpeg -loglevel quiet -readrate 1 -stream_loop -1 -i /Users/huangshuisheng/Desktop/hss/galaxy-s10/billd-live-server/src/video/fddm_mhsw.mp4 -vcodec copy -acodec copy -f flv 'rtmp://localhost/livestream/roomId___2?token=47b650e1196e9c9d5b30f18cbd7a3cf1&random_id=B86Os2F5sf'
```

### 破音问题

当前电脑正在播放音频，如果此时开始直播，添加了一个视频素材（有声音的），然后拖拽这个视频素材，就会出现类似破音问题。如果把电脑的外放音频都关闭了，再开始直播添加视频素材，拖拽就不会出现破音问题。

### video标签属性

```html
<!-- x-webkit-airplay这个属性应该是使此视频支持ios的AirPlay功能 -->
<!-- playsinline、 webkit-playsinline IOS微信浏览器支持小窗内播放 -->
<!-- x5-video-player-type 启用H5播放器，是wechat安卓版特性 -->
<!-- x5-video-player-fullscreen 全屏设置 -->
<!-- x5-video-orientation 声明播放器支持的方向，可选值landscape横屏，portraint竖屏。默认值portraint。 -->
<video
  autoplay
  webkit-playsinline="true"
  playsinline
  x-webkit-airplay="allow"
  x5-video-player-type="h5"
  x5-video-player-fullscreen="true"
  x5-video-orientation="portraint"
  muted
></video>
```

### flv.js

~~不通过 npm 安装 flv.js，因为安装了 flv.js 后，`import flvJs from 'flv.js'` 会导致 vscode 的 ts 错乱。因此直接下载 flv.min.js 使用。~~，应该是我的 vscode 用了 vscode 的 ts 版本（ts 的 5.x 版本），用回工作区（也就是项目里面安装的 ts 的 4.9 的版本）的 ts 版本就没事了？

### video.js 报错

Chrome 版本 114.0.5735.133（正式版本） (arm64)，调试移动端的时候，此时的地址栏是：http://localhost:8000/h5/3?liveType=srsHlsPull，使用模拟的安卓设备，点击播放没问题（播放的 hls），但是换成模拟一个苹果设备（任意苹果设备都行，iphone6,7,8,X,12 Pro 等等），点击播放都会报错：`VIDEOJS: ERROR: (CODE:4 MEDIA_ERR_SRC_NOT_SUPPORTED) The media could not be loaded, either because the server or network failed or because the format is not supported.`

Firefox 版本 114.0.2 (64 位)，调试移动端时，此时的地址栏是：http://localhost:8000/h5/3?liveType=srsHlsPull，模拟安卓、苹果设备都能正常播放，但是小概率会报 blob 解码，但刷新就又好了

Safari 版本：版本 16.5.1 (18615.2.9.11.7)，开发===>响应式设计模式，模拟任何苹果设备，都能正常播放，并且行为和实际的苹果手机行为一致（苹果手机有的 bug，在电脑的 Safari 调试的时候也有。但电脑的 Firfox 和 Chrome 调试时没有，实际上电脑的 Firfox 和 Chrome 调试时应该也要出现这个 bug）