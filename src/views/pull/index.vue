<template>
  <div class="pull-wrap">
    <template v-if="roomNoLive">当前房间没在直播~</template>
    <template v-else>
      <div class="left">
        <div
          ref="topRef"
          class="head"
        >
          <div class="info">
            <div class="avatar"></div>
            <div class="detail">
              <div class="top">房间号：{{ route.params.roomId }}</div>
              <div class="bottom">
                <span>你的socketId：{{ getSocketId() }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="video-wrap">
          <video
            id="localVideo"
            ref="localVideoRef"
            autoplay
            webkit-playsinline="true"
            playsinline
            x-webkit-airplay="allow"
            x5-video-player-type="h5"
            x5-video-player-fullscreen="true"
            x5-video-orientation="portraint"
            muted
            controls
          ></video>
        </div>
        <div
          ref="bottomRef"
          class="gift"
        >
          <div
            v-for="(item, index) in giftList"
            :key="index"
            class="item"
          >
            <div class="ico"></div>
            <div class="name">{{ item.name }}</div>
            <div class="price">{{ item.price }}</div>
          </div>
        </div>
      </div>
      <div class="right">
        <div class="tab">
          <span>在线用户</span>
          <span> | </span>
          <span>大航海</span>
        </div>
        <div class="user-list">
          <div
            v-for="(item, index) in liveUserList"
            :key="index"
            class="item"
          >
            <div class="info">
              <div class="avatar"></div>
              <div class="nickname">{{ item.socketId }}</div>
            </div>
            <div class="expr">{{ item.expr }}</div>
          </div>
        </div>
        <div class="danmu-list">
          <div
            v-for="(item, index) in damuList"
            :key="index"
            class="item"
          >
            <span class="name">{{ item.socketId }}：</span>
            <span class="msg">{{ item.msg }}</span>
          </div>
        </div>
        <div class="send-msg">
          <textarea
            v-model="danmuStr"
            class="ipt"
          ></textarea>
          <div
            class="btn"
            @click="sendDanmu"
          >
            发送
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import { IAdminIn, ICandidate, IOffer, liveTypeEnum } from '@/interface';
import { WebRTCClass } from '@/network/webRtc';
import {
  WebSocketClass,
  WsConnectStatusEnum,
  WsMsgTypeEnum,
} from '@/network/webSocket';
import { useAppStore } from '@/store/app';
import { useNetworkStore } from '@/store/network';

const networkStore = useNetworkStore();
const route = useRoute();
const appStore = useAppStore();
const danmuStr = ref('');
const topRef = ref<HTMLDivElement>();
const bottomRef = ref<HTMLDivElement>();
const roomNoLive = ref(false);
const isAddTrack = ref(false);
const roomIdRef = ref<HTMLInputElement>();
const joinRef = ref<HTMLButtonElement>();
const leaveRef = ref<HTMLButtonElement>();
const roomId = ref('');
const websocketInstant = ref<WebSocketClass>();
const isDone = ref(false);
const localVideoRef = ref<HTMLVideoElement>();
const localStream = ref();
const currType = ref(liveTypeEnum.camera); // 1:摄像头，2:录屏
const joined = ref(false);
const offerSended = ref(new Set());

const giftList = ref([
  { name: '鲜花', ico: '', price: '免费' },
  { name: '肥宅水', ico: '', price: '2元' },
  { name: '小鸡腿', ico: '', price: '3元' },
  { name: '大鸡腿', ico: '', price: '5元' },
  { name: '一杯咖啡', ico: '', price: '10元' },
]);

const damuList = ref<
  {
    socketId: string;
    msgType: number;
    msg: string;
  }[]
>([]);

const liveUserList = ref<
  {
    socketId: string;
    avatar: string;
    expr: number;
  }[]
>([]);

function closeWs() {
  const instance = networkStore.wsMap.get(roomId.value);
  if (!instance) return;
  instance.close();
}

function sendDanmu() {
  if (!danmuStr.value.length) {
    alert('请输入弹幕内容！');
  }
  if (!websocketInstant.value) return;
  websocketInstant.value.send({
    msgType: WsMsgTypeEnum.message,
    data: { msg: danmuStr.value },
  });
  damuList.value.push({
    socketId: getSocketId(),
    msgType: 1,
    msg: danmuStr.value,
  });
  danmuStr.value = '';
}

onUnmounted(() => {
  closeWs();
});

onMounted(() => {
  if (topRef.value && bottomRef.value && localVideoRef.value) {
    const res =
      bottomRef.value.getBoundingClientRect().top -
      (topRef.value.getBoundingClientRect().top +
        topRef.value.getBoundingClientRect().height);
    localVideoRef.value.style.height = `${res}px`;
  }
  roomId.value = route.params.roomId as string;
  console.warn('开始new WebSocketClass');
  websocketInstant.value = new WebSocketClass({
    roomId: roomId.value,
    url:
      process.env.NODE_ENV === 'development'
        ? 'ws://localhost:4300'
        : 'wss://live.hsslive.cn',
    isAdmin: false,
  });
  websocketInstant.value.update();
  initReceive();
  sendJoin();

  localVideoRef.value?.addEventListener('loadstart', () => {
    console.warn('视频流-loadstart');
    const rtc = networkStore.getRtcMap(roomId.value);
    if (!rtc) return;
    rtc.rtcStatus.loadstart = true;
    rtc.update();
  });

  localVideoRef.value?.addEventListener('loadedmetadata', () => {
    console.warn('视频流-loadedmetadata');
    const rtc = networkStore.getRtcMap(roomId.value);
    if (!rtc) return;
    rtc.rtcStatus.loadedmetadata = true;
    rtc.update();
    batchSendOffer();
  });
});

function getSocketId() {
  return networkStore.wsMap.get(roomId.value!)?.socketIo?.id || '-1';
}

function sendJoin() {
  const instance = networkStore.wsMap.get(roomId.value);
  if (!instance) return;
  instance.send({ msgType: WsMsgTypeEnum.join, data: {} });
}

function batchSendOffer() {
  liveUserList.value.forEach(async (item) => {
    if (
      !offerSended.value.has(item.socketId) &&
      item.socketId !== getSocketId()
    ) {
      await startNewWebRtc(item.socketId);
      await addTrack();
      console.warn('new WebRTCClass完成');
      console.log('执行sendOffer', {
        sender: getSocketId(),
        receiver: item.socketId,
      });
      sendOffer({ sender: getSocketId(), receiver: item.socketId });
      offerSended.value.add(item.socketId);
    }
  });
}

function closeRtc() {
  networkStore.rtcMap.forEach((rtc) => {
    rtc.close();
  });
}

function initReceive() {
  const instance = websocketInstant.value;
  if (!instance?.socketIo) return;
  // websocket连接成功
  instance.socketIo.on(WsConnectStatusEnum.connect, () => {
    console.log('【websocket】websocket连接成功', instance.socketIo?.id);
    if (!instance) return;
    instance.status = WsConnectStatusEnum.connect;
    instance.update();
  });

  // websocket连接断开
  instance.socketIo.on(WsConnectStatusEnum.disconnect, () => {
    console.log('【websocket】websocket连接断开', instance);
    if (!instance) return;
    instance.status = WsConnectStatusEnum.disconnect;
    instance.update();
  });

  // 当前所有在线用户
  instance.socketIo.on(WsMsgTypeEnum.roomLiveing, (data: IAdminIn) => {
    console.log('【websocket】收到管理员正在直播', data);
  });

  // 当前所有在线用户
  instance.socketIo.on(WsMsgTypeEnum.roomNoLive, (data: IAdminIn) => {
    console.log('【websocket】收到管理员不在直播', data);
    roomNoLive.value = true;
    closeRtc();
  });

  // 当前所有在线用户
  instance.socketIo.on(WsMsgTypeEnum.liveUser, (data) => {
    console.log('【websocket】当前所有在线用户', data);
    if (!instance) return;
    liveUserList.value = data.map((item) => ({
      avatar: 'red',
      socketId: item.id,
      expr: 1,
    }));
  });

  // 收到offer
  instance.socketIo.on(WsMsgTypeEnum.offer, async (data: IOffer) => {
    console.warn('【websocket】收到offer', data);
    if (!instance) return;
    if (data.data.receiver === getSocketId()) {
      console.log('收到offer，这个offer是发给我的');
      const rtc = startNewWebRtc(data.data.sender);
      await rtc.setRemoteDescription(data.data.sdp);
      const sdp = await rtc.createAnswer();
      await rtc.setLocalDescription(sdp);
      websocketInstant.value?.send({
        msgType: WsMsgTypeEnum.answer,
        data: { sdp, sender: getSocketId(), receiver: data.data.sender },
      });
    } else {
      console.log('收到offer，但是这个offer不是发给我的');
    }
  });

  // 收到answer
  instance.socketIo.on(WsMsgTypeEnum.answer, async (data: IOffer) => {
    console.warn('【websocket】收到answer', data);
    if (isDone.value) return;
    if (!instance) return;
    const rtc = networkStore.getRtcMap(`${roomId.value}___${data.socketId}`);
    console.log(rtc, '收到answer收到answer');
    if (!rtc) return;
    rtc.rtcStatus.answer = true;
    rtc.update();
    if (data.data.receiver === getSocketId()) {
      console.log('收到answer，这个answer是发给我的');
      await rtc.setRemoteDescription(data.data.sdp);
    } else {
      console.log('收到answer，但这个answer不是发给我的');
    }
  });

  // 收到candidate
  instance.socketIo.on(WsMsgTypeEnum.candidate, (data: ICandidate) => {
    console.warn('【websocket】收到candidate', data);
    if (isDone.value) return;
    if (!instance) return;
    const rtc =
      networkStore.getRtcMap(`${roomId.value}___${data.socketId}`) ||
      networkStore.getRtcMap(roomId.value);
    if (!rtc) return;
    if (data.socketId !== getSocketId()) {
      console.log('不是我发的candidate');
      const candidate = new RTCIceCandidate({
        sdpMid: data.data.sdpMid,
        sdpMLineIndex: data.data.sdpMLineIndex,
        candidate: data.data.candidate,
      });
      rtc.peerConnection
        ?.addIceCandidate(candidate)
        .then(() => {
          console.log('candidate成功');
          // rtc.handleStream();
        })
        .catch((err) => {
          console.error('candidate失败', err);
        });
    } else {
      console.log('是我发的candidate');
    }
  });

  // 收到用户发送消息
  instance.socketIo.on(WsMsgTypeEnum.message, (data) => {
    console.log('【websocket】收到用户发送消息', data);
    if (!instance) return;
    damuList.value.push({
      socketId: data.socketId,
      msgType: 1,
      msg: data.data.msg,
    });
  });

  // 用户加入房间
  instance.socketIo.on(WsMsgTypeEnum.join, (data) => {
    console.log('【websocket】用户加入房间', data);
    if (!instance) return;
  });

  // 用户加入房间
  instance.socketIo.on(WsMsgTypeEnum.joined, (data) => {
    console.log('【websocket】用户加入房间完成', data);
    joined.value = true;
  });

  // 其他用户加入房间
  instance.socketIo.on(WsMsgTypeEnum.otherJoin, (data) => {
    console.log('【websocket】其他用户加入房间', data);
    if (joined.value) {
      batchSendOffer();
    }
  });

  // 用户离开房间
  instance.socketIo.on(WsMsgTypeEnum.leave, (data) => {
    console.log('【websocket】用户离开房间', data);
    if (!instance) return;
    instance.socketIo?.emit(WsMsgTypeEnum.leave, {
      roomId: instance.roomId,
    });
  });

  // 用户离开房间完成
  instance.socketIo.on(WsMsgTypeEnum.leaved, (data) => {
    console.log('【websocket】用户离开房间完成', data);
    if (!instance) return;
    const res = liveUserList.value.filter(
      (item) => item.socketId !== data.socketId
    );
    liveUserList.value = res;
    console.log('当前所有在线用户', JSON.stringify(res));
  });
}

async function startMediaDevices() {
  currType.value = liveTypeEnum.camera;
  if (!localStream.value) {
    // WARN navigator.mediaDevices在localhost和https才能用，http://192.168.1.103:8000局域网用不了
    const event = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    console.log('getUserMedia成功', event);
    if (!localVideoRef.value) return;
    localVideoRef.value.srcObject = event;
    localStream.value = event;
  }
}
function addTrack() {
  if (!localStream.value) return;
  liveUserList.value.forEach((item) => {
    if (item.socketId !== getSocketId()) {
      localStream.value.getTracks().forEach((track) => {
        const rtc = networkStore.getRtcMap(
          `${roomId.value}___${item.socketId}`
        );
        rtc?.addTrack(track, localStream.value);
      });
    }
  });
  isAddTrack.value = true;
}

async function startGetDisplayMedia() {
  currType.value = liveTypeEnum.screen;
  if (!localStream.value) {
    // WARN navigator.mediaDevices.getDisplayMedia在localhost和https才能用，http://192.168.1.103:8000局域网用不了
    const event = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true,
    });
    console.log('getDisplayMedia成功', event);
    if (!localVideoRef.value) return;
    localVideoRef.value.srcObject = event;
    localStream.value = event;
  }
}

async function sendOffer({
  sender,
  receiver,
}: {
  sender: string;
  receiver: string;
}) {
  if (isDone.value) return;
  if (!websocketInstant.value) return;
  const rtc = networkStore.getRtcMap(`${roomId.value}___${receiver}`);
  if (!rtc) return;
  const sdp = await rtc.createOffer();
  await rtc.setLocalDescription(sdp);
  websocketInstant.value.send({
    msgType: WsMsgTypeEnum.offer,
    data: { sdp, sender, receiver },
  });
}

function startNewWebRtc(receiver: string) {
  console.warn('开始new WebRTCClass', receiver);
  const rtc = new WebRTCClass({ roomId: `${roomId.value}___${receiver}` });
  rtc.rtcStatus.joined = true;
  rtc.update();
  return rtc;
}

function leave() {
  if (joinRef.value && leaveRef.value && roomIdRef.value) {
    roomIdRef.value.disabled = false;
    joinRef.value.disabled = false;
    leaveRef.value.disabled = true;
  }
  if (!websocketInstant.value) return;
  websocketInstant.value.socketIo?.emit(WsMsgTypeEnum.leave, {
    roomId: websocketInstant.value.roomId,
  });
}
</script>

<style lang="scss" scoped>
.pull-wrap {
  margin: 20px auto 0;
  min-width: $large-width;
  height: 700px;
  text-align: center;
  .left {
    position: relative;
    display: inline-block;
    box-sizing: border-box;
    width: $large-left-width;
    height: 100%;
    border: 1px solid red;
    border-radius: 10px;
    background-color: white;
    color: #9499a0;
    vertical-align: top;
    .head {
      display: flex;
      justify-content: space-between;
      padding: 20px;
      background-color: pink;
      .tag {
        display: inline-block;
        margin-right: 5px;
        padding: 1px 4px;
        border: 1px solid;
        border-radius: 2px;
        color: #9499a0;
        font-size: 12px;
      }

      .info {
        display: flex;
        align-items: center;
        text-align: initial;

        .avatar {
          margin-right: 20px;
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background-color: yellow;
        }
        .detail {
          .top {
            margin-bottom: 10px;
            color: #18191c;
          }
          .bottom {
            font-size: 14px;
          }
        }
      }
      .other {
        display: flex;
        flex-direction: column;
        justify-content: center;
        font-size: 12px;
        .top {
          display: flex;
          align-items: center;
          .item {
            display: flex;
            align-items: center;
            margin-right: 20px;
            .ico {
              display: inline-block;
              margin-right: 4px;
              width: 10px;
              height: 10px;
              border-radius: 50%;
              background-color: skyblue;
            }
          }
        }
        .bottom {
          margin-top: 10px;
        }
      }
    }
    .video-wrap {
      // height: 100px;
      // height: 550px;
      background-color: #18191c;
      #localVideo {
        max-width: 100%;
        max-height: 100%;
      }
    }
    .gift {
      position: absolute;
      right: 0;
      bottom: 0;
      left: 0;
      display: flex;
      align-items: center;
      justify-content: space-around;
      height: 100px;
      background-color: yellow;
      .item {
        margin-right: 10px;
        text-align: center;

        .ico {
          width: 50px;
          height: 50px;
          background-color: skyblue;
        }
        .name {
          color: #18191c;
          font-size: 12px;
        }
        .price {
          color: #9499a0;
          font-size: 12px;
        }
      }
    }
  }
  .right {
    position: relative;
    display: inline-block;
    box-sizing: border-box;
    box-sizing: border-box;
    margin-left: 10px;
    min-width: 300px;
    height: 100%;
    border: 1px solid red;
    border-radius: 10px;
    background-color: white;
    color: #9499a0;
    .tab {
      display: flex;
      align-items: center;
      justify-content: space-evenly;
      padding: 5px 0;
      font-size: 12px;
    }
    .user-list {
      overflow-y: scroll;
      padding: 0 15px;
      height: 100px;
      background-color: pink;
      .item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 10px;
        font-size: 12px;
        .info {
          display: flex;
          align-items: center;
          .avatar {
            margin-right: 5px;
            width: 25px;
            height: 25px;
            border-radius: 50%;
            background-color: skyblue;
          }
          .nickname {
            color: black;
          }
        }
      }
    }
    .danmu-list {
      overflow-y: scroll;
      padding: 0 15px;
      height: 350px;
      text-align: initial;
      .item {
        margin-bottom: 10px;
        font-size: 12px;
        .name {
          color: #9499a0;
        }
        .msg {
          color: #61666d;
        }
      }
    }
    .send-msg {
      position: absolute;
      bottom: 15px;
      box-sizing: border-box;
      padding: 0 10px;
      width: 100%;
      .ipt {
        display: block;
        box-sizing: border-box;
        margin: 0 auto;
        padding: 10px;
        width: 100%;
        height: 60px;
        outline: none;
        border: 1px solid hsla(0, 0%, 60%, 0.2);
        border-radius: 4px;
        background-color: #f1f2f3;
        font-size: 14px;
      }
      .btn {
        box-sizing: border-box;
        margin-top: 10px;
        margin-left: auto;
        padding: 5px;
        width: 80px;
        border-radius: 4px;
        background-color: #23ade5;
        color: white;
        text-align: center;
        font-size: 12px;
      }
    }
  }
}

// 屏幕宽度小于$large-width的时候
@media screen and (max-width: $large-width) {
  .pull-wrap {
    .left {
      width: $medium-left-width;
    }
    .right {
      .list {
        .item {
          width: 150px;
          height: 80px;
        }
      }
    }
  }
}
</style>
