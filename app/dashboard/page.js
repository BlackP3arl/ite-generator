'use client';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ThemeToggle } from '../components/ThemeToggle';

export default function DashboardHome() {
  const { data: session } = useSession();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'ITE_VIEWER':
        return 'VIEWER';
      case 'ITE_CREATOR':
        return 'CREATOR';
      case 'ITE_REVIEWER':
        return 'REVIEWER';
      case 'ITE_APPROVER':
        return 'APPROVER';
      default:
        return role;
    }
  };

  return (
    <div className="simplified-home">
      {/* Animated gradient background */}
      <div className="gradient-bg">
        <div className="gradient-orb gradient-orb-1"></div>
        <div className="gradient-orb gradient-orb-2"></div>
        <div className="gradient-orb gradient-orb-3"></div>
      </div>

      {/* Top right user controls */}
      <div className="home-top-right">
        <ThemeToggle />
        <div className="home-user-profile" onClick={() => setShowUserMenu(!showUserMenu)}>
          <div className="home-user-info">
            <span className="home-user-name">
              {session?.user?.name || 'Admin User'}
            </span>
            <span className="home-user-role">
              {getRoleDisplayName(session?.user?.role) || 'ADMIN'}
            </span>
          </div>
          <div className="home-user-avatar">
            {(session?.user?.name || session?.user?.email || 'A').charAt(0).toUpperCase()}
          </div>
        </div>

        {showUserMenu && (
          <div className="home-user-dropdown">
            <div className="home-dropdown-item home-user-info-item">
              <div className="home-dropdown-user-name">
                {session?.user?.name || 'User'}
              </div>
              <div className="home-dropdown-user-email">
                {session?.user?.email}
              </div>
            </div>
            <div className="home-dropdown-divider"></div>
            <button
              className="home-dropdown-item home-dropdown-btn"
              onClick={() => signOut()}
            >
              <span>🚪</span>
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="home-content">
        <div className="home-actions">
          <button
            className="action-btn action-btn-new"
            onClick={() => router.push('/dashboard/ite?action=create')}
          >
            <div className="action-btn-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </div>
            <span className="action-btn-text">New ITE</span>
          </button>

          <button
            className="action-btn action-btn-view"
            onClick={() => router.push('/dashboard/ite')}
          >
            <div className="action-btn-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </div>
            <span className="action-btn-text">View ITE</span>
          </button>
        </div>
      </div>

      <style jsx>{`
        .simplified-home {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          margin-left: -2rem;
          margin-top: -72px;
          width: 100vw;
        }

        .gradient-bg {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
          overflow: hidden;
        }

        .home-top-right {
          position: fixed;
          top: 2rem;
          right: 2rem;
          z-index: 100;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .home-user-profile {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem 0.75rem;
          border-radius: 50px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .home-user-profile:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.3);
        }

        .home-user-info {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.25rem;
        }

        .home-user-name {
          font-size: 0.9rem;
          font-weight: 600;
          color: white;
        }

        .home-user-role {
          font-size: 0.7rem;
          padding: 0.125rem 0.5rem;
          border-radius: 12px;
          font-weight: 600;
          background: rgba(255, 255, 255, 0.2);
          color: white;
        }

        .home-user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.1rem;
        }

        .home-user-dropdown {
          position: absolute;
          top: calc(100% + 0.5rem);
          right: 0;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
          min-width: 220px;
          z-index: 1000;
          overflow: hidden;
        }

        .home-dropdown-item {
          padding: 0.875rem 1.25rem;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
          transition: background 0.15s ease;
        }

        .home-dropdown-item:hover {
          background: rgba(0, 0, 0, 0.05);
        }

        .home-user-info-item {
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        }

        .home-dropdown-user-name {
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 0.25rem;
        }

        .home-dropdown-user-email {
          font-size: 0.85rem;
          color: #64748b;
        }

        .home-dropdown-divider {
          height: 1px;
          background: rgba(0, 0, 0, 0.1);
          margin: 0;
        }

        .home-dropdown-btn {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 500;
          color: #1e293b;
        }

        .home-dropdown-btn:hover {
          background: #fee;
          color: #dc2626;
        }

        .gradient-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.3;
          animation: float 20s ease-in-out infinite;
        }

        .gradient-orb-1 {
          width: 500px;
          height: 500px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          top: -10%;
          left: -10%;
          animation-delay: 0s;
        }

        .gradient-orb-2 {
          width: 400px;
          height: 400px;
          background: linear-gradient(135deg, #06b6d4, #3b82f6);
          bottom: -10%;
          right: -10%;
          animation-delay: -7s;
        }

        .gradient-orb-3 {
          width: 350px;
          height: 350px;
          background: linear-gradient(135deg, #8b5cf6, #ec4899);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation-delay: -14s;
        }

        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(30px, -30px) scale(1.1);
          }
          50% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          75% {
            transform: translate(20px, 30px) scale(1.05);
          }
        }

        .home-content {
          position: relative;
          z-index: 10;
          text-align: center;
          color: white;
        }

        .home-actions {
          display: flex;
          gap: 1.5rem;
          justify-content: center;
          align-items: center;
        }

        .action-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          width: 140px;
          height: 140px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          padding: 1.5rem;
        }

        .action-btn:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.3);
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }

        .action-btn-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .action-btn-text {
          font-size: 0.95rem;
          font-weight: 600;
          color: white;
        }

        @media (max-width: 768px) {
          .simplified-home {
            margin-top: -72px;
          }

          .home-top-right {
            top: 1rem;
            right: 1rem;
          }

          .home-user-info {
            display: none;
          }

          .home-actions {
            flex-direction: row;
            gap: 1rem;
          }

          .action-btn {
            width: 120px;
            height: 120px;
          }

          .gradient-orb-1,
          .gradient-orb-2,
          .gradient-orb-3 {
            width: 300px;
            height: 300px;
          }
        }
      `}</style>
    </div>
  );
}
