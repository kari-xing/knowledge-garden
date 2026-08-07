import axios, { AxiosError, type AxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/authStore';
import type { ApiResponse } from '../types';

/** 后端统一前缀：开发模式经 Vite 代理，生产由 nginx 反代 */
export const API_BASE: string = import.meta.env.VITE_API_BASE ?? '/api/v1';

export const client = axios.create({
  baseURL: API_BASE,
  timeout: 60_000,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (resp) => resp,
  (error: AxiosError<ApiResponse>) => {
    // 未认证 / token 失效：清理本地会话并回到登录页
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** 后端错误响应（FastAPI 为 { detail }，业务为 { code, message }） */
type ErrorBody = { detail?: string; message?: string };

/** 解包 { code, message, data }，非 0 时抛出 ApiError */
export async function unwrap<T>(
  promise: Promise<{ data: ApiResponse<T> }>,
): Promise<T> {
  let resp: { data: ApiResponse<T> };
  try {
    resp = await promise;
  } catch (e) {
    const ax = e as AxiosError<ErrorBody>;
    const detail =
      ax.response?.data?.message ??
      ax.response?.data?.detail ??
      (typeof (e as Error)?.message === 'string' ? (e as Error).message : '') ??
      '网络请求失败';
    const status = ax.response?.status ?? 0;
    throw new ApiError(status, String(detail));
  }
  const body = resp.data;
  if (body.code !== 0) {
    throw new ApiError(body.code, body.message);
  }
  return body.data as T;
}

export type { AxiosRequestConfig };
