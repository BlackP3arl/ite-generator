'use client';

import { useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      // Redirect to dashboard if already logged in
      router.push('/dashboard');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p className="loading-text">Loading...</p>
      </div>
    );
  }

  if (status === 'authenticated') {
    return null; // Will redirect
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">📋</div>
          <h1 className="login-title">ITE Generator</h1>
          <p className="login-subtitle">
            Automate Item Technical Evaluation document creation
          </p>
        </div>

        <div className="login-content">
          <p className="login-description">
            Welcome to the Item Technical Evaluation system. This application helps you
            create, review, and manage technical evaluations efficiently.
          </p>

          <button
            onClick={() => signIn()}
            className="btn btn-primary btn-large"
          >
            Sign In to Continue
          </button>

          <div className="login-features">
            <div className="feature-item">
              <span className="feature-icon">✨</span>
              <span className="feature-text">Automated Document Generation</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🔄</span>
              <span className="feature-text">Workflow Management</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">👥</span>
              <span className="feature-text">Role-Based Access Control</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📊</span>
              <span className="feature-text">Comprehensive Reporting</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .loading-screen {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: var(--color-bg);
          position: relative;
          z-index: 1;
        }

        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          position: relative;
          z-index: 1;
        }

        .login-card {
          background: rgba(20, 24, 30, 0.7);
          backdrop-filter: blur(40px) saturate(180%);
          -webkit-backdrop-filter: blur(40px) saturate(180%);
          border: 1px solid var(--glass-border);
          border-radius: 24px;
          box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5),
                      0 0 0 1px rgba(255, 255, 255, 0.05),
                      0 0 64px rgba(245, 166, 35, 0.1);
          max-width: 480px;
          width: 100%;
          overflow: hidden;
          position: relative;
        }

        .login-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--gold), transparent);
        }

        .login-header {
          background: linear-gradient(135deg, rgba(245, 166, 35, 0.1) 0%, rgba(245, 166, 35, 0.05) 100%);
          color: var(--foreground);
          padding: 3rem 2rem;
          text-align: center;
          position: relative;
        }

        .login-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
          filter: drop-shadow(0 0 20px rgba(245, 166, 35, 0.3));
        }

        .login-title {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          background: linear-gradient(135deg, var(--foreground) 0%, var(--gold) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .login-subtitle {
          font-size: 1rem;
          opacity: 0.8;
          color: var(--muted-foreground);
        }

        .login-content {
          padding: 2.5rem 2rem;
          background: rgba(255, 255, 255, 0.02);
        }

        .login-description {
          color: var(--muted-foreground);
          line-height: 1.6;
          margin-bottom: 2rem;
          text-align: center;
        }

        .btn-large {
          width: 100%;
          padding: 1rem 2rem;
          font-size: 1.1rem;
          margin-bottom: 2rem;
          background: linear-gradient(135deg, var(--gold) 0%, #D89420 100%);
          box-shadow: 0 8px 24px rgba(245, 166, 35, 0.3);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .btn-large:hover {
          box-shadow: 0 12px 32px rgba(245, 166, 35, 0.4);
          transform: translateY(-2px);
        }

        .login-features {
          border-top: 1px solid var(--glass-border);
          padding-top: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: var(--foreground);
          padding: 0.5rem;
          border-radius: 0.5rem;
          transition: all 0.2s ease;
        }

        .feature-item:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .feature-icon {
          font-size: 1.5rem;
          line-height: 1;
          filter: drop-shadow(0 0 10px rgba(245, 166, 35, 0.3));
        }

        .feature-text {
          font-size: 0.95rem;
          font-weight: 500;
        }

        @media (max-width: 640px) {
          .login-container {
            padding: 1rem;
          }

          .login-header {
            padding: 2rem 1.5rem;
          }

          .login-content {
            padding: 2rem 1.5rem;
          }

          .login-title {
            font-size: 1.75rem;
          }
        }
      `}</style>
    </div>
  );
}
