import { useEffect, useState } from 'react';

/** คืนค่าที่หน่วงเวลา — ใช้กับช่องค้นหาเพื่อไม่ให้ยิง API ทุกตัวอักษร */
export function useDebounce<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
