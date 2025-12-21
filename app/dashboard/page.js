'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function DashboardHome() {
  const { data: session } = useSession();
  const router = useRouter();

  const modules = [
    {
      id: 'ite',
      name: 'ITE Module',
      icon: '📋',
      description: 'Item Technical Evaluation',
      path: '/dashboard/ite',
      color: '#0066cc',
      enabled: true,
      stats: {
        label: 'Active ITEs',
        value: '-',
      },
    },
    {
      id: 'module2',
      name: 'Module 2',
      icon: '📊',
      description: 'Coming Soon',
      path: '/dashboard/module2',
      color: '#6366f1',
      enabled: false,
    },
    {
      id: 'module3',
      name: 'Module 3',
      icon: '📈',
      description: 'Coming Soon',
      path: '/dashboard/module3',
      color: '#8b5cf6',
      enabled: false,
    },
  ];

  const handleModuleClick = (module) => {
    if (module.enabled) {
      router.push(module.path);
    }
  };

  return (
    <div className="dashboard-home">
      <div className="welcome-section">
        <h1 className="welcome-title">
          Welcome back, {session?.user?.name || session?.user?.email?.split('@')[0]}!
        </h1>
        <p className="welcome-subtitle">
          Select a module below to get started
        </p>
      </div>

      <div className="modules-grid">
        {modules.map((module) => (
          <div
            key={module.id}
            className={`module-card ${!module.enabled ? 'disabled' : ''}`}
            onClick={() => handleModuleClick(module)}
            style={{
              borderLeftColor: module.color,
            }}
          >
            <div className="module-card-header">
              <div className="module-card-icon" style={{ color: module.color }}>
                {module.icon}
              </div>
              {!module.enabled && (
                <span className="coming-soon-badge">Coming Soon</span>
              )}
            </div>

            <div className="module-card-body">
              <h3 className="module-card-title">{module.name}</h3>
              <p className="module-card-description">{module.description}</p>
            </div>

            {module.stats && module.enabled && (
              <div className="module-card-stats">
                <span className="stats-label">{module.stats.label}</span>
                <span className="stats-value">{module.stats.value}</span>
              </div>
            )}

            {module.enabled && (
              <div className="module-card-footer">
                <span className="module-card-link">
                  Open Module →
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="quick-actions-section">
        <h2 className="section-title">Quick Actions</h2>
        <div className="quick-actions-grid">
          <button
            className="quick-action-card"
            onClick={() => router.push('/dashboard/ite')}
          >
            <span className="quick-action-icon">✨</span>
            <span className="quick-action-text">Create New ITE</span>
          </button>

          <button
            className="quick-action-card"
            onClick={() => router.push('/dashboard/ite')}
          >
            <span className="quick-action-icon">📂</span>
            <span className="quick-action-text">View All ITEs</span>
          </button>

          {session?.user?.role === 'ADMIN' && (
            <button
              className="quick-action-card"
              onClick={() => router.push('/admin')}
            >
              <span className="quick-action-icon">⚙️</span>
              <span className="quick-action-text">Manage Users</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
