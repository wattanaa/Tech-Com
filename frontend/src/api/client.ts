import axios, { AxiosError } from 'axios';

/** รูปแบบ error ที่ backend ส่งกลับมาเสมอ */
export interface ApiErrorBody {
  success: false;
  error: { code: string; message: string; fields?: Record<string, string> };
  requestId?: string;
}

/** error ที่ปั้นให้ UI ใช้งานง่าย — มีข้อความภาษาไทยพร้อมแสดงเสมอ */
export class ApiClientError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  withCredentials: true, // ส่ง session cookie ไปด้วยทุกครั้ง
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    // หมดเวลา / เครือข่ายล่ม — ไม่มี response กลับมา
    if (!error.response) {
      const message =
        error.code === 'ECONNABORTED'
          ? 'ระบบใช้เวลาตอบสนองนานเกินไป กรุณาลองใหม่อีกครั้ง'
          : 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่';
      return Promise.reject(new ApiClientError('NETWORK_ERROR', message, 0));
    }

    const { status, data } = error.response;

    // session หมดอายุ — พากลับไปหน้าเข้าสู่ระบบ (ยกเว้นตอนกำลังเช็คสถานะล็อกอินเอง)
    if (status === 401 && !error.config?.url?.includes('/auth/me')) {
      const path = window.location.pathname;
      if (path.startsWith('/admin') && path !== '/admin/login') {
        window.location.href = `/admin/login?redirect=${encodeURIComponent(path)}`;
      }
    }

    return Promise.reject(
      new ApiClientError(
        data?.error?.code ?? 'UNKNOWN',
        data?.error?.message ?? 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง',
        status,
        data?.error?.fields,
      ),
    );
  },
);

/** แกะ envelope { success, data } ให้เหลือเฉพาะ data */
export async function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const res = await apiClient.get<{ data: T }>(url, { params });
  return res.data.data;
}

export async function post<T>(url: string, body?: unknown): Promise<T> {
  const res = await apiClient.post<{ data: T }>(url, body);
  return res.data.data;
}

export async function put<T>(url: string, body?: unknown): Promise<T> {
  const res = await apiClient.put<{ data: T }>(url, body);
  return res.data.data;
}

export async function patch<T>(url: string, body?: unknown): Promise<T> {
  const res = await apiClient.patch<{ data: T }>(url, body);
  return res.data.data;
}

export async function del(url: string): Promise<void> {
  await apiClient.delete(url);
}
