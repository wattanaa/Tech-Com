import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './styles/index.css';

/**
 * ตั้งค่า TanStack Query กลาง
 * retry 2 ครั้งแบบ exponential backoff — ตามข้อกำหนด Availability ของ CIA
 * แต่ไม่ retry เมื่อเป็น error ฝั่งผู้ใช้ (4xx) เพราะลองใหม่ก็ได้ผลเดิม
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        const status = (error as { status?: number }).status ?? 0;
        if (status >= 400 && status < 500) return false;
        return failureCount < 2;
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
    },
    mutations: { retry: 0 },
  },
});

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('ไม่พบ element #root ใน index.html');

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
