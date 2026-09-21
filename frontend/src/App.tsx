import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { PublicLayout } from '@/layouts/PublicLayout';
import { Spinner } from '@/components/ui/feedback';

/**
 * เส้นทางของเว็บไซต์สาธารณะ (PHASE 9)
 * แต่ละหน้าถูกแยก bundle ด้วย React.lazy เพื่อให้หน้าแรกโหลดเฉพาะที่จำเป็น
 * ส่วนหลังบ้าน (/admin) จะเพิ่มใน PHASE 10
 */
const HomePage = lazy(() => import('@/pages/public/HomePage'));
const AboutPage = lazy(() => import('@/pages/public/AboutPage'));
const ProgramsPage = lazy(() => import('@/pages/public/ProgramsPage'));
const ProgramDetailPage = lazy(() => import('@/pages/public/ProgramDetailPage'));
const CoursesPage = lazy(() => import('@/pages/public/CoursesPage'));
const TeachersPage = lazy(() => import('@/pages/public/TeachersPage'));
const ProjectsPage = lazy(() => import('@/pages/public/ProjectsPage'));
const ProjectDetailPage = lazy(() => import('@/pages/public/ProjectDetailPage'));
const ActivitiesPage = lazy(() => import('@/pages/public/ActivitiesPage'));
const NewsPage = lazy(() => import('@/pages/public/NewsPage'));
const NewsDetailPage = lazy(() => import('@/pages/public/NewsDetailPage'));
const FacilitiesPage = lazy(() => import('@/pages/public/FacilitiesPage'));
const GalleryPage = lazy(() => import('@/pages/public/GalleryPage'));
const ContactPage = lazy(() => import('@/pages/public/ContactPage'));
const SearchPage = lazy(() => import('@/pages/public/SearchPage'));
const NotFoundPage = lazy(() => import('@/pages/public/NotFoundPage'));

export default function App() {
  return (
    <Suspense fallback={<div className="pt-24"><Spinner /></div>}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/programs" element={<ProgramsPage />} />
          <Route path="/programs/:code" element={<ProgramDetailPage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/teachers" element={<TeachersPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:slug" element={<ProjectDetailPage />} />
          <Route path="/activities" element={<ActivitiesPage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/news/:slug" element={<NewsDetailPage />} />
          <Route path="/facilities" element={<FacilitiesPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
