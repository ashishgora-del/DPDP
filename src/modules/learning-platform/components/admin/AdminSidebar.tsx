import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface NavItem {
  name: string;
  path: string;
  icon: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export default function AdminSidebar() {
  const location = useLocation();
  const basePath = '/trinetrai/learning-platform';

  const navSections: NavSection[] = [
    {
      title: 'Overview',
      items: [
        { name: 'Dashboard', path: `${basePath}/admin`, icon: '📊' }
      ]
    },
    {
      title: 'Content Management',
      items: [
        { name: 'Domains', path: `${basePath}/admin/domains`, icon: '🏛️' },
        { name: 'Learning Paths', path: `${basePath}/admin/paths`, icon: '🛤️' },
        { name: 'Courses', path: `${basePath}/admin/courses`, icon: '📚' },
        { name: 'Modules', path: `${basePath}/admin/modules`, icon: '📦' },
        { name: 'Categories', path: `${basePath}/admin/categories`, icon: '🏷️' }
      ]
    },
    {
      title: 'User Management',
      items: [
        { name: 'Users', path: `${basePath}/admin/users`, icon: '👥' },
        { name: 'Enrollments', path: `${basePath}/admin/enrollments`, icon: '📝' }
      ]
    },
    {
      title: 'Analytics',
      items: [
        { name: 'Reports', path: `${basePath}/admin/analytics`, icon: '📈' }
      ]
    }
  ];

  const isActive = (path: string) => {
    if (path === `${basePath}/admin`) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Admin Panel</h2>
        <p className="text-sm text-gray-500">Learning Platform</p>
      </div>

      <nav className="px-3 pb-6">
        {navSections.map((section, idx) => (
          <div key={idx} className="mb-6">
            <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {section.title}
            </h3>
            <div className="space-y-1">
              {section.items.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive(item.path)
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-6 py-4 border-t border-gray-200">
        <Link
          to={basePath}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Platform
        </Link>
      </div>
    </aside>
  );
}
