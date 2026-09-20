import { Router } from 'express';
import { getNewsList, getNewsBySlug } from '../controllers/news.controller.js';
import { getPrograms, getCourses } from '../controllers/academic.controller.js';
import { getTeachers } from '../controllers/teacher.controller.js';
import { getProjects } from '../controllers/project.controller.js';
import { getActivities, getFacilities } from '../controllers/public.controller.js';

const router = Router();

// News
router.get('/news', getNewsList);
router.get('/news/:slug', getNewsBySlug);

// Academic
router.get('/programs', getPrograms);
router.get('/courses', getCourses);

// Teachers
router.get('/teachers', getTeachers);

// Projects
router.get('/projects', getProjects);

// Activities & Facilities
router.get('/activities', getActivities);
router.get('/facilities', getFacilities);

export default router;