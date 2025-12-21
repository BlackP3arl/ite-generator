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
        }

        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 2rem;
        }

        .login-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          max-width: 480px;
          width: 100%;
          overflow: hidden;
        }

        .login-header {
          background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%);
          color: white;
          padding: 3rem 2rem;
          text-align: center;
        }

        .login-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .login-title {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .login-subtitle {
          font-size: 1rem;
          opacity: 0.9;
        }

        .login-content {
          padding: 2.5rem 2rem;
        }

        .login-description {
          color: var(--color-text-secondary);
          line-height: 1.6;
          margin-bottom: 2rem;
          text-align: center;
        }

        .btn-large {
          width: 100%;
          padding: 1rem 2rem;
          font-size: 1.1rem;
          margin-bottom: 2rem;
        }

        .login-features {
          border-top: 1px solid var(--color-border);
          padding-top: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: var(--color-text);
        }

        .feature-icon {
          font-size: 1.5rem;
          line-height: 1;
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
