'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="theme-toggle-skeleton">
        <div className="theme-btn">
          <span>🌓</span>
        </div>
      </div>
    );
  }

  const currentTheme = theme === 'system' ? systemTheme : theme;

  return (
    <div className="theme-toggle">
      <button
        onClick={() => {
          if (theme === 'light') setTheme('dark');
          else if (theme === 'dark') setTheme('system');
          else setTheme('light');
        }}
        className="theme-btn"
        title={`Theme: ${theme === 'system' ? `System (${systemTheme})` : theme}`}
      >
        {theme === 'system' && <span className="theme-icon">🌓</span>}
        {theme === 'light' && <span className="theme-icon">☀️</span>}
        {theme === 'dark' && <span className="theme-icon">🌙</span>}
      </button>

      <div className="theme-dropdown">
        <button
          onClick={() => setTheme('light')}
          className={`theme-option ${theme === 'light' ? 'active' : ''}`}
        >
          <span>☀️</span>
          <span>Light</span>
          {theme === 'light' && <span className="check">✓</span>}
        </button>

        <button
          onClick={() => setTheme('dark')}
          className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
        >
          <span>🌙</span>
          <span>Dark</span>
          {theme === 'dark' && <span className="check">✓</span>}
        </button>

        <button
          onClick={() => setTheme('system')}
          className={`theme-option ${theme === 'system' ? 'active' : ''}`}
        >
          <span>🌓</span>
          <span>System</span>
          {theme === 'system' && <span className="check">✓</span>}
        </button>
      </div>

      <style jsx>{`
        .theme-toggle {
          position: relative;
        }

        .theme-toggle-skeleton {
          opacity: 0.5;
        }

        .theme-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          padding: 0;
          background: transparent;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.2s ease;
          color: var(--color-text);
        }

        .theme-btn:hover {
          background: #f8f9fa;
        }

        .theme-icon {
          font-size: 1.25rem;
          line-height: 1;
        }

        .theme-dropdown {
          position: absolute;
          top: calc(100% + 0.5rem);
          right: 0;
          background: white;
          border: 1px solid var(--color-border);
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
          padding: 0.25rem;
          min-width: 160px;
          z-index: 1000;
          opacity: 0;
          visibility: hidden;
          transform: translateY(-4px);
          transition: all 0.2s ease;
        }

        .theme-toggle:hover .theme-dropdown {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

        .theme-option {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          padding: 0.625rem 0.75rem;
          background: transparent;
          border: none;
          border-radius: 0.375rem;
          cursor: pointer;
          transition: all 0.15s ease;
          font-size: 0.875rem;
          color: var(--color-text);
          text-align: left;
        }

        .theme-option:hover {
          background: #f8f9fa;
        }

        .theme-option.active {
          background: #f8f9fa;
          font-weight: 600;
        }

        .theme-option span:first-child {
          font-size: 1.125rem;
        }

        .theme-option span:nth-child(2) {
          flex: 1;
        }

        .check {
          color: var(--color-primary);
          font-weight: 700;
        }
      `}</style>
    </div>
  );
}
