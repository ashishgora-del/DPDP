import { ChevronRight, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';

interface BreadcrumbItem {
  label: string;
  path: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  const location = useLocation();
  
  // Auto-generate breadcrumbs from URL if not provided
  const breadcrumbItems = items || generateBreadcrumbs(location.pathname);

  if (breadcrumbItems.length === 0) return null;

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center space-x-2 text-sm ${className}`}
      aria-label="Breadcrumb"
    >
      <Link
        to="/"
        className="text-gray-600 hover:text-purple-600 transition-colors flex items-center"
        aria-label="Home"
      >
        <Home className="h-4 w-4" />
      </Link>

      {breadcrumbItems.map((item, index) => (
        <div key={item.path} className="flex items-center space-x-2">
          <ChevronRight className="h-4 w-4 text-gray-400" />
          {index === breadcrumbItems.length - 1 ? (
            <span className="text-gray-900 font-medium">{item.label}</span>
          ) : (
            <Link
              to={item.path}
              className="text-gray-600 hover:text-purple-600 transition-colors"
            >
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </motion.nav>
  );
}

function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];

  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    
    // Skip IDs and certain paths
    if (isUUID(segment) || segment === 'editor') return;

    const label = formatSegmentLabel(segment, segments, index);
    breadcrumbs.push({ label, path: currentPath });
  });

  return breadcrumbs;
}

function formatSegmentLabel(segment: string, allSegments: string[], index: number): string {
  // Map common routes to friendly names
  const labelMap: Record<string, string> = {
    'risk-assessment': 'Risk Assessment',
    'template-generation': 'Template Generation',
    'learning-platform': 'Learning Platform',
    'compliance-tracker': 'Compliance Tracker',
    'start': 'Assessment',
    'results': 'Results',
    'custom': 'Custom Generator',
    'documents': 'My Documents',
    'workbench': 'Template Workbench',
    'faq': 'FAQ',
    'resources': 'Resources',
    'courses': 'Courses',
    'lessons': 'Lesson',
    'admin': 'Admin Panel',
  };

  // Check if it's a known route
  if (labelMap[segment]) {
    return labelMap[segment];
  }

  // If it's after "results" or "editor", it might be an ID - show context
  if (index > 0) {
    const prevSegment = allSegments[index - 1];
    if (prevSegment === 'results') {
      return 'Assessment Results';
    }
    if (prevSegment === 'editor') {
      return 'Document Editor';
    }
    if (prevSegment === 'courses') {
      return 'Course Details';
    }
  }

  // Default: capitalize and replace hyphens
  return segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}
