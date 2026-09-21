import { useQuery } from '@tanstack/react-query';
import { getNavigation, getSettings } from '@/api/public';
import { FALLBACK_NAV } from '@/constants/site';
import type { NavigationItem, SiteSettings } from '@/types';

/** เมนูหลัก — โหลดจาก API แต่ถ้าล้มเหลวใช้เมนูสำรอง เว็บจึงใช้งานได้เสมอ */
export function useNavigation(): NavigationItem[] {
  const { data } = useQuery({
    queryKey: ['navigation'],
    queryFn: getNavigation,
    staleTime: 10 * 60_000,
  });
  return data && data.length > 0 ? data : FALLBACK_NAV;
}

/** การตั้งค่าเว็บไซต์ทั้งหมด (footer, contact, about, social) — โหลดครั้งเดียวใช้ทั้งเว็บ */
export function useSettings(): SiteSettings {
  const { data } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
    staleTime: 10 * 60_000,
  });
  return data ?? {};
}
