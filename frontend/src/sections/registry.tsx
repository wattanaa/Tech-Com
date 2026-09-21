import type { HomepageSection } from '@/types';
import { getActivities, getCourses, getFacilities, getNews, getPrograms, getProjects, getTeachers } from '@/api/public';
import { HeroSection } from './Hero';
import { StatisticsSection } from './Statistics';
import { AboutSection } from './About';
import { GallerySection } from './Gallery';
import { ContactSection } from './Contact';
import { CollectionSection } from './CollectionSection';
import { ActivityCard, CourseCard, FacilityCard, NewsCard, ProgramCard, ProjectCard, TeacherCard } from '@/components/cards';

/** อ่านค่า limit จาก config ของ section ถ้ามี */
function lim(section: HomepageSection, fallback: number): number {
  return (section.config.limit as number) ?? fallback;
}

/** แปลง HomepageSection 1 รายการเป็นคอมโพเนนต์ที่ถูกต้องตามชนิด */
export function renderSection(section: HomepageSection) {
  switch (section.type) {
    case 'HERO':
      return <HeroSection section={section} />;
    case 'STATISTICS':
      return <StatisticsSection section={section} />;
    case 'ABOUT':
      return <AboutSection section={section} />;
    case 'GALLERY':
      return <GallerySection section={section} />;
    case 'CONTACT':
      return <ContactSection section={section} />;

    case 'PROGRAMS':
      return (
        <CollectionSection
          eyebrow="Programs" title={section.title ?? 'หลักสูตรที่เปิดสอน'} subtitle={section.subtitle ?? undefined}
          viewAllHref="/programs" cols={2}
          queryKey={['home', 'programs']} queryFn={() => getPrograms({ limit: 2 })}
          renderItem={(p) => <ProgramCard program={p} />}
        />
      );
    case 'COURSES':
      return (
        <CollectionSection tinted
          eyebrow="Courses" title={section.title ?? 'รายวิชา'} subtitle={section.subtitle ?? undefined}
          viewAllHref="/courses" cols={3}
          queryKey={['home', 'courses']} queryFn={() => getCourses({ limit: lim(section, 6) })}
          renderItem={(c) => <CourseCard course={c} />}
        />
      );
    case 'TEACHERS':
      return (
        <CollectionSection
          eyebrow="Teachers" title={section.title ?? 'ครูและบุคลากร'} subtitle={section.subtitle ?? undefined}
          viewAllHref="/teachers" cols={4}
          queryKey={['home', 'teachers']} queryFn={() => getTeachers({ limit: lim(section, 8) })}
          renderItem={(t) => <TeacherCard teacher={t} />}
        />
      );
    case 'PROJECTS':
      return (
        <CollectionSection tinted
          eyebrow="Projects" title={section.title ?? 'ผลงานนักศึกษา'} subtitle={section.subtitle ?? undefined}
          viewAllHref="/projects" cols={3}
          queryKey={['home', 'projects']} queryFn={() => getProjects({ limit: lim(section, 6) })}
          renderItem={(p) => <ProjectCard project={p} />}
        />
      );
    case 'ACTIVITIES':
      return (
        <CollectionSection
          eyebrow="Activities" title={section.title ?? 'กิจกรรม'} subtitle={section.subtitle ?? undefined}
          viewAllHref="/activities" cols={2}
          queryKey={['home', 'activities']} queryFn={() => getActivities({ limit: lim(section, 4) })}
          renderItem={(a) => <ActivityCard activity={a} />}
        />
      );
    case 'NEWS':
      return (
        <CollectionSection tinted
          eyebrow="News" title={section.title ?? 'ข่าวประชาสัมพันธ์'} subtitle={section.subtitle ?? undefined}
          viewAllHref="/news" cols={3}
          queryKey={['home', 'news']} queryFn={() => getNews({ limit: lim(section, 3), sortBy: 'publishedAt', order: 'desc' })}
          renderItem={(n) => <NewsCard news={n} />}
        />
      );
    case 'FACILITIES':
      return (
        <CollectionSection
          eyebrow="Facilities" title={section.title ?? 'ห้องปฏิบัติการ'} subtitle={section.subtitle ?? undefined}
          viewAllHref="/facilities" cols={3}
          queryKey={['home', 'facilities']} queryFn={() => getFacilities({ limit: lim(section, 6) })}
          renderItem={(f) => <FacilityCard facility={f} />}
        />
      );
    default:
      return null;
  }
}
