import { IPaging } from '@/interface';
import { IUser } from '@/types/IUser';
import request from '@/utils/request';

export function fetchUserRegister({ username, password }) {
  return request.post('/user/register', {
    username,
    password,
  });
}

export function fetchQrcodeLogin({ platform, exp }) {
  return request.post<{
    login_id: string;
    exp: any;
    platform: any;
    isLogin: boolean;
    token: string;
  }>('/user/qrcode_login', {
    platform,
    exp,
  });
}

// eslint-disable-next-line
export function fetchQrcodeLoginStatus({ platform, login_id }) {
  return request.get<{
    login_id: string;
    exp: any;
    platform: any;
    isLogin: boolean;
    token: string;
  }>('/user/qrcode_login_status', {
    // eslint-disable-next-line
    params: { platform, login_id },
  });
}

export function fetchUserIdLogin({ id, password, exp }) {
  return request.post('/user/id_login', {
    id,
    password,
    exp,
  });
}

export function fetchUserUsernameLogin({ username, password, exp }) {
  return request.post('/user/username_login', {
    username,
    password,
    exp,
  });
}

export function fetchIdLogin({ id, password }) {
  return request.post('/user/login', {
    id,
    password,
  });
}

export function fetchUserInfo() {
  return request.get<IUser>('/user/get_user_info');
}

export function fetchFindUser(userId: number) {
  return request.get(`/user/find/${userId}`);
}

export function fetchUserList(params: { orderName: string; orderBy: string }) {
  return request.get<IPaging<IUser>>('/user/list', { params });
}
