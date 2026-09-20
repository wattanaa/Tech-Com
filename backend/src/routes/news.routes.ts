import { Router } from 'express';
import { getNewsList } from '../controllers/news.controller';
import { requireAuth, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// สาธารณะ (ใครก็อ่านได้)
router.get('/', getNewsList);

// เฉพาะ Admin / Super Admin ที่สร้างหรือลบข่าวได้
router.post('/', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN', 'EDITOR']), createNews);
router.delete('/:id', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), deleteNews);

export default router;