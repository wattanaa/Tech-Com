import { Route, Routes } from 'react-router-dom';
import SetupPage from './pages/SetupPage';

/**
 * PHASE 1 — มีเพียงหน้าตรวจสถานะระบบ เพื่อยืนยันว่า Frontend ต่อกับ API ได้จริง
 *
 * PHASE 9-10 จะแทนที่ด้วยโครงเส้นทางจริง:
 *   <Route element={<PublicLayout />}>      … 13 หน้าสาธารณะ
 *   <Route path="/admin" element={<AdminLayout />}>  … หน้าจัดการทั้งหมด
 * โดยทุกหน้าใน /admin ห่อด้วย <ProtectedRoute requiredPermission="...">
 */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SetupPage />} />
      <Route path="*" element={<SetupPage />} />
    </Routes>
  );
}
