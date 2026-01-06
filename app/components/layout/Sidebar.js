'use client';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function Sidebar({ session, isHomePage = false }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const modules = [
    {
      id: 'ite',
      name: 'ITE Module',
      icon: '📋',
      path: '/dashboard/ite',
      description: 'Item Technical Evaluation',
      enabled: true,
    },
    {
      id: 'module2',
      name: 'Module 2',
      icon: '📊',
      path: '/dashboard/module2',
      description: 'Coming Soon',
      enabled: false,
    },
    {
      id: 'module3',
      name: 'Module 3',
      icon: '📈',
      path: '/dashboard/module3',
      description: 'Coming Soon',
      enabled: false,
    },
  ];

  const handleModuleClick = (module) => {
    if (module.enabled) {
      router.push(module.path);
    }
  };

  const isActive = (path) => {
    return pathname?.startsWith(path);
  };

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isHomePage ? 'sidebar-transparent' : ''}`}>
      <div className="sidebar-header">
        <button
          className={`dashboard-btn ${pathname === '/dashboard' ? 'active' : ''}`}
          onClick={() => router.push('/dashboard')}
          title="Dashboard Home"
        >
          <span className="dashboard-icon">🏠</span>
        </button>
      </div>

      <div className="sidebar-modules">
        {/* Module icons removed for cleaner look */}
      </div>

      <div className="sidebar-footer">
        {session?.user?.role === 'ADMIN' && (
          <button
            className={`settings-btn ${isActive('/admin') ? 'active' : ''}`}
            onClick={() => router.push('/admin')}
            title="Admin Settings"
          >
            <span className="settings-icon">⚙️</span>
          </button>
        )}
      </div>
    </div>
  );
}
