<template>
  <div class="rank-wrap">
    <div class="type-list">
      <div
        v-for="(item, index) in rankTypeList"
        :key="index"
        :class="{ item: 1, active: item.type === currRankType }"
        @click="changeCurrRankType(item.type)"
      >
        {{ t(item.label) }}
      </div>
    </div>

    <div
      v-if="rankList.length"
      v-loading="loading"
      class="rank-list"
    >
      <div class="top">
        <div
          v-for="(item, index) in [
            rankList[1],
            rankList[0],
            rankList[2],
          ].filter((v) => v !== undefined)"
          :key="currRankType + '-' + index"
          :class="{ item: 1, [`rank-${item.rank}`]: 1 }"
        >
          <div
            class="avatar"
            @click="
              currRankType !== RankTypeEnum.blog && handleJump(item.users[0])
            "
          >
            <Avatar
              :size="100"
              :url="item.users[0]?.avatar"
              :name="item.users[0]?.username"
              :living="!!item.live?.live"
            ></Avatar>
          </div>
          <div class="username">{{ item.users[0]?.username }}</div>
          <div class="rank">
            <i>0{{ item.rank }}</i>
            <div
              v-if="item.live?.live && currRankType === RankTypeEnum.liveRoom"
              class="living"
              @click="handleJoin(item.live)"
            >
              {{ t('common.living') }}
            </div>
          </div>
          <div
            v-if="currRankType === RankTypeEnum.wallet"
            class="wallet"
          >
            <span>{{ t('common.wallet') }}: </span>
            <span>{{ formatBalance(item.balance) }}￥</span>
          </div>
          <div
            v-if="currRankType === RankTypeEnum.signin"
            class="signin"
          >
            <span>
              {{ t('rank.accumulatedSignin', { nums: item.signin_nums }) }}
            </span>
          </div>
        </div>
      </div>
      <div class="top50-list">
        <div
          v-for="(item, index) in rankList.filter((_item, index) => index >= 3)"
          :key="index"
          class="top50-item"
        >
          <div class="rank">
            <i>{{ item.rank >= 10 ? item.rank : '0' + item.rank }}</i>
          </div>
          <div
            class="left"
            @click="
              currRankType !== RankTypeEnum.blog && handleJump(item.users[0])
            "
          >
            <Avatar
              :size="28"
              :url="item.users[0]?.avatar"
              :name="item.users[0]?.username"
              :living="!!item.live?.live"
              disableLiving
            ></Avatar>
            <div class="username">{{ item.users[0]?.username }}</div>
            <div
              v-if="currRankType === RankTypeEnum.wallet"
              class="wallet"
            >
              <span>{{ t('common.wallet') }}: </span>
              <span>{{ formatBalance(item.balance) }}￥</span>
            </div>
            <div
              v-if="currRankType === RankTypeEnum.signin"
              class="signin"
            >
              <span>
                （{{
                  t('rank.accumulatedSignin', { nums: item.signin_nums })
                }}）
              </span>
            </div>
            <div
              v-if="item.live?.live && currRankType === RankTypeEnum.liveRoom"
              class="living-tag"
              @click.stop="handleJoin(item.live)"
            >
              {{ t('common.living') }}
            </div>
          </div>
          <div class="right"></div>
        </div>
      </div>
    </div>
    <div
      v-if="!rankList.length && !loading"
      class="null"
    >
      暂无数据
    </div>
  </div>
</template>

<script lang="ts" setup>
import { openToTarget } from 'billd-utils';
import { onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { fetchLiveRoomList } from '@/api/liveRoom';
import { fetchSigninList } from '@/api/signin';
import { fetchUserList } from '@/api/user';
import { fetchWalletList } from '@/api/wallet';
import { RankTypeEnum, SwitchEnum } from '@/interface';
import router, { routerName } from '@/router';
import { useUserStore } from '@/store/user';
import { ILiveRoom } from '@/types/ILiveRoom';
import { formatBalance } from '@/utils';

const userStore = useUserStore();
export interface IRankType {
  type: RankTypeEnum;
  label: string;
}

const rankTypeList = ref<IRankType[]>([
  {
    type: RankTypeEnum.liveRoom,
    label: 'rank.liveRank',
  },
  {
    type: RankTypeEnum.user,
    label: 'rank.userRank',
  },
  {
    type: RankTypeEnum.wallet,
    label: 'rank.richRank',
  },
  {
    type: RankTypeEnum.signin,
    label: 'rank.signinRank',
  },
  // {
  //   type: RankTypeEnum.blog,
  //   label: '博客用户',
  // },
]);

const mockDataNums = 4;

const pageParams = reactive({
  nowPage: 1,
  pageSize: 50,
});

const currRankType = ref(RankTypeEnum.liveRoom);
const { t } = useI18n();
const loading = ref(true);
const mockRank: {
  users: { id; username; avatar }[];
  rank: number;
  level: number;
  score: number;
  balance: number;
  signin_nums: number;
  live?: ILiveRoom;
}[] = [
  // {
  //   users: [
  //     {
  //       id: -1,
  //       username: '待上榜',
  //       avatar: '',
  //     },
  //   ],
  //   rank: 1,
  //   level: 0,
  //   score: 0,
  //   balance: 0,
  //   signin_nums: 0,
  //   live: undefined,
  // },
  // {
  //   users: [
  //     {
  //       id: -1,
  //       username: '待上榜',
  //       avatar: '',
  //     },
  //   ],
  //   rank: 2,
  //   level: 0,
  //   score: 0,
  //   balance: 0,
  //   signin_nums: 0,
  //   live: undefined,
  // },
  // {
  //   users: [
  //     {
  //       id: -1,
  //       username: '待上榜',
  //       avatar: '',
  //     },
  //   ],
  //   rank: 3,
  //   level: 0,
  //   score: 0,
  //   balance: 0,
  //   signin_nums: 0,
  //   live: undefined,
  // },
  // {
  //   users: [
  //     {
  //       id: -1,
  //       username: '待上榜',
  //       avatar: '',
  //     },
  //   ],
  //   rank: 4,
  //   level: 0,
  //   score: 0,
  //   balance: 0,
  //   signin_nums: 0,
  //   live: undefined,
  // },
];
const rankList = ref(mockRank);

function handleJump(item) {
  if (userStore.userInfo?.id === item.id) {
    router.push({
      name: routerName.centerUserInfo,
    });
  } else {
    router.push({
      name: routerName.user,
      params: { id: item.id },
    });
  }
}

function handleJoin(item) {
  const url = router.resolve({
    name: routerName.pull,
    params: { roomId: item.live.live_room_id },
  });
  openToTarget(url.href);
}

async function getWalletList() {
  try {
    loading.value = true;
    const res = await fetchWalletList({
      ...pageParams,
      orderName: 'balance',
      orderBy: 'desc',
    });
    if (res.code === 200) {
      const length = res.data.rows.length;
      rankList.value = res.data.rows.map((item, index) => {
        return {
          users: [
            {
              id: item.user?.id,
              username: item.user?.username,
              avatar: item.user?.avatar || '',
            },
          ],
          rank: index + 1,
          level: 0,
          score: 0,
          balance: item.balance || 0,
          signin_nums: 0,
        };
      });
      if (length < mockDataNums) {
        rankList.value.push(...mockRank.slice(length));
      }
    }
  } catch (error) {
    console.log(error);
  }
  loading.value = false;
}

async function getLiveRoomList() {
  try {
    loading.value = true;
    const res = await fetchLiveRoomList({
      is_show: SwitchEnum.yes,
      orderName: 'updated_at',
      orderBy: 'desc',
      ...pageParams,
    });
    if (res.code === 200) {
      const length = res.data.rows.length;
      rankList.value = res.data.rows.map((item, index) => {
        return {
          users: [
            {
              id: item.users?.[0]?.id,
              username: item.users?.[0]?.username,
              avatar: item.users?.[0]?.avatar || '',
            },
          ],
          live: item,
          rank: index + 1,
          level: 0,
          score: 0,
          balance: 0,
          signin_nums: 0,
        };
      });
      if (length < mockDataNums) {
        rankList.value.push(...mockRank.slice(length));
      }
    }
  } catch (error) {
    console.log(error);
  }
  loading.value = false;
}

async function getUserList() {
  try {
    loading.value = true;
    const res = await fetchUserList({
      orderName: 'updated_at',
      orderBy: 'desc',
      ...pageParams,
    });
    if (res.code === 200) {
      const length = res.data.rows.length;
      rankList.value = res.data.rows.map((item, index) => {
        return {
          users: [
            {
              id: item.id,
              username: item.username,
              avatar: item.avatar || '',
            },
          ],
          rank: index + 1,
          level: 0,
          score: 0,
          balance: 0,
          signin_nums: 0,
        };
      });
      if (length < mockDataNums) {
        rankList.value.push(...mockRank.slice(length));
      }
    }
  } catch (error) {
    console.log(error);
  }
  loading.value = false;
}

async function getSigninList() {
  try {
    loading.value = true;
    const res = await fetchSigninList({
      ...pageParams,
      orderName: 'sum_nums,max_nums,recently_signin_time',
      orderBy: 'desc,desc,desc',
    });
    if (res.code === 200) {
      const length = res.data.rows.length;
      rankList.value = res.data.rows.map((item, index) => {
        return {
          users: [
            {
              id: item.user?.id,
              username: item.user?.username,
              avatar: item.user?.avatar || '',
            },
          ],
          rank: index + 1,
          level: 0,
          score: 0,
          balance: 0,
          signin_nums: item.sum_nums || 0,
        };
      });
      if (length < mockDataNums) {
        rankList.value.push(...mockRank.slice(length));
      }
    }
  } catch (error) {
    console.log(error);
  }
  loading.value = false;
}

function changeCurrRankType(type: RankTypeEnum) {
  currRankType.value = type;
  switch (type) {
    case RankTypeEnum.liveRoom:
      getLiveRoomList();
      break;
    case RankTypeEnum.user:
      getUserList();
      break;
    case RankTypeEnum.signin:
      getSigninList();
      break;
    case RankTypeEnum.wallet:
      getWalletList();
      break;
    default:
      break;
  }
}

onMounted(() => {
  changeCurrRankType(currRankType.value);
});
</script>

<style lang="scss" scoped>
.rank-wrap {
  overflow: scroll;
  box-sizing: border-box;
  height: 100%;
  background-color: #f4f4f4;

  @extend %customScrollbar;
  .type-list {
    display: flex;
    align-items: center;
    margin: 20px 0;
    width: 100%;
    .item {
      flex: 1;
      margin: 0 10px;
      height: 40px;
      border-radius: 10px;
      background-color: $theme-color-gold;
      color: white;
      text-align: center;
      font-weight: bold;
      font-size: 20px;
      line-height: 40px;
      filter: grayscale(1);
      cursor: pointer;

      &.active {
        filter: grayscale(0);
      }
    }
  }
  .rank-list {
    width: 100%;

    .living-tag {
      display: inline-block;
      margin: 0 auto;
      padding: 2px 5px;
      width: 40px;
      border: 1px solid $theme-color-gold;
      border-radius: 10px;
      color: $theme-color-gold;
      text-align: center;
      font-size: 12px;
      line-height: 1.2;
      cursor: pointer;
    }

    .top {
      display: flex;
      align-items: flex-end;
      justify-content: center;
      margin-top: 100px;
      width: 100%;
      .item {
        position: relative;
        margin: 0 20px;
        width: 200px;
        height: 180px;
        border-radius: 15px;
        background-color: white;
        text-align: center;

        &.rank-1 {
          height: 200px;
          border-color: #ff6744;
          color: #ff6744;
          .rank {
            margin-top: 20px;
          }
          .avatar-wrap {
            .avatar {
              border: 2px solid #ff6744;
            }
          }
        }
        &.rank-2 {
          border-color: #44d6ff;
          color: #44d6ff;
          .avatar-wrap {
            .avatar {
              border: 2px solid #44d6ff;
            }
          }
        }
        &.rank-3 {
          border-color: #ffb200;
          color: #ffb200;
          .avatar-wrap {
            .avatar {
              border: 2px solid #ffb200;
            }
          }
        }

        .avatar {
          display: inline-block;
          margin-top: -50px;
          cursor: pointer;
        }

        .username {
          margin-bottom: 10px;
          font-size: 22px;
        }

        .rank {
          position: relative;
          display: inline-block;
          padding: 0px 20px;
          border: 1px solid;
          border-radius: 20px;
          font-size: 20px;
          .living {
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translate(-50%, 130%);

            @extend .living-tag;
          }
        }
        .wallet,
        .signin {
          margin-top: 10px;
        }
      }
    }
    .top50-list {
      margin-top: 20px;
      border-radius: 10px;
      background-color: white;
      .top50-item {
        display: flex;
        align-items: center;
        padding: 0 10px;
        height: 40px;
        color: #666;
        &:nth-child(2n) {
          background-color: #fafbfc;
        }
        .rank {
          box-sizing: border-box;
          margin-right: 20px;
          width: 80px;
          border-radius: 40px;
          background-color: #84f9da;
          color: white;
          text-align: center;
          font-size: 20px;
        }
        .left {
          display: flex;
          align-items: center;
          font-size: 12px;
          cursor: pointer;
          .avatar {
            width: 28px;
            height: 28px;
            border-radius: 50%;
          }
          .username {
            margin-right: 15px;
            margin-left: 10px;
            max-width: 200px;

            @extend %singleEllipsis;
          }
          .wallet,
          .signin {
            margin-left: 4px;
          }
        }
      }
    }
  }
  .null {
    width: 100%;
    text-align: center;
  }
}
</style>
