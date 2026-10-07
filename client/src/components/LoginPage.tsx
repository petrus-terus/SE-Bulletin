import React, { useState } from 'react';

import { supabase } from '../services/supabaseClient';
import styles from './LoginPage.module.css';

interface Props {
  onShowNotice?: (message: string) => void;
}

export const LoginPage: React.FC<Props> = ({ onShowNotice }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const email = identifier.trim().toLowerCase();
    if (!email) {
      setErrorMessage('Please enter your corporate email address.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      if (!supabase) throw new Error('Supabase is not configured.');
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        throw error;
      }
      
      if (onShowNotice) {
        onShowNotice('Sign in successful! Welcome to SE Bulletin.');
      }
    } catch (err: any) {
      console.warn('[LoginPage] Sign in verification error:', err);
      setErrorMessage(err.message || 'Unable to complete sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.heroHeader}>
        <img
          src="/grid_horizon_hero.jpg"
          alt="Sabah Electricity High-Voltage Transmission Tower at Sunset with Mount Kinabalu"
          className={styles.heroImage}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = '/mock-images/image1.png';
          }}
        />
        <div className={styles.heroGradientOverlay} />

        <div className={styles.heroContent}>
          <span className={styles.heroEyebrow}>Internal Staff Portal</span>
          <h1 className={styles.heroTitle}>
            Welcome to Sabah Electricity <span className={styles.heroBrandHighlight}>SE Bulletin</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Energising Sabah with reliability, safety, and pride.
          </p>
        </div>
      </header>

      <main className={styles.loginSheet}>
        <div className={styles.sheetHandleBar}>
          <div className={styles.sheetHandle} />
        </div>

        <div className={styles.brandHeader}>
          <div className={styles.logoDoubleBezel}>
            <img
              src="/sesb_logo.png"
              alt="Sabah Electricity Sdn. Bhd."
              className={styles.brandLogo}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/sabah_electricity_logo.png';
              }}
            />
          </div>
          <div className={styles.brandMeta}>
            <h2 className={styles.sheetHeading}>Staff Login</h2>
            <p className={styles.sheetSubheading}>
              Sign in to access corporate bulletins & rosters
            </p>
          </div>
        </div>

        {errorMessage && (
          <div
            style={{
              backgroundColor: '#FEF2F2',
              border: '1px solid #FCA5A5',
              color: '#991B1B',
              fontSize: '13px',
              padding: '10px 14px',
              borderRadius: '10px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              margin: '8px 0',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px', flexShrink: 0 }}>
              error
            </span>
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSignInSubmit} className={styles.formContainer}>
          <div className={styles.inputGroup}>
            <label htmlFor="staff-identifier" className={styles.inputLabel}>
              Corporate Email
            </label>
            <div className={styles.inputFieldWrapper}>
              <span className={`material-symbols-outlined ${styles.inputIcon}`}>
                mail
              </span>
              <input
                id="staff-identifier"
                type="email"
                className={styles.textInput}
                placeholder="name@sesb.com.my"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
                required
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="staff-password" className={styles.inputLabel}>
              Password
            </label>
            <div className={styles.inputFieldWrapper}>
              <span className={`material-symbols-outlined ${styles.inputIcon}`}>
                lock
              </span>
              <input
                id="staff-password"
                type={showPassword ? 'text' : 'password'}
                className={styles.textInput}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className={styles.revealToggleBtn}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            className={styles.signInBtn}
            disabled={isLoading}
          >
            {isLoading ? (
              <span>Signing in...</span>
            ) : (
              <>
                <span>Sign In</span>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  arrow_forward
                </span>
              </>
            )}
          </button>
        </form>

        <footer className={styles.loginFooter}>
          <p className={styles.footerText}>
            Wisma SESB HQ • Sabah Electricity Sdn. Bhd. • Pilot Staging
          </p>
        </footer>
      </main>
    </div>
  );
};
