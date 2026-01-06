'use client';
import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { ThemeToggle } from '../ThemeToggle';

export default function DashboardHeader({ session, messageInfo, hideSearch = false }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    // TODO: Implement global search functionality
    console.log('Search query:', searchQuery);
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'ADMIN':
        return '#ffeaa7';
      case 'ITE_APPROVER':
        return '#d1e7dd';
      case 'ITE_REVIEWER':
        return '#cff4fc';
      case 'ITE_CREATOR':
        return '#cfe2ff';
      case 'ITE_VIEWER':
        return '#e9ecef';
      default:
        return '#f0f0f0';
    }
  };

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

  if (hideSearch) {
    return null;
  }

  return (
    <>
      <div className="dashboard-header-bar">
        <div className="header-search">
          <form onSubmit={handleSearch}>
            <input
              type="text"
              className="search-input"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </div>

        <div className="header-user-section">
          <ThemeToggle />
          <div
            className="user-profile"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="user-info">
              <span className="user-name">
                {session?.user?.name || session?.user?.email}
              </span>
              {session?.user?.role && (
                <span
                  className="user-role-badge"
                  style={{
                    backgroundColor: getRoleBadgeColor(session.user.role),
                  }}
                >
                  {getRoleDisplayName(session.user.role)}
                </span>
              )}
            </div>
            <div className="user-avatar">
              {(session?.user?.name || session?.user?.email || 'U').charAt(0).toUpperCase()}
            </div>
          </div>

          {showUserMenu && (
            <div className="user-dropdown">
              <div className="dropdown-item user-info-item">
                <div className="dropdown-user-name">
                  {session?.user?.name || 'User'}
                </div>
                <div className="dropdown-user-email">
                  {session?.user?.email}
                </div>
              </div>
              <div className="dropdown-divider"></div>
              <button
                className="dropdown-item dropdown-btn"
                onClick={() => signOut()}
              >
                <span>🚪</span>
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {messageInfo && (
        <div className={`message-banner ${messageInfo.type}`}>
          <span className="message-icon">
            {messageInfo.type === 'error' ? '⚠️' : 'ℹ️'}
          </span>
          <span className="message-text">{messageInfo.message}</span>
          {messageInfo.onClose && (
            <button className="message-close" onClick={messageInfo.onClose}>
              ✕
            </button>
          )}
        </div>
      )}
    </>
  );
}
