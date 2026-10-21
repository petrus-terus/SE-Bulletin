import React, { useState } from 'react';
import { supabase } from '@/services/supabaseClient';
import { DEFAULT_LOGO_URL, DEFAULT_COVER_URL } from '@/constants/bulletin';
import { handleLogoError, handleCoverError } from '@/utils/imageFallbacks';
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
  const [activePillLogin, setActivePillLogin] = useState<string | null>(null);

  const executeLogin = async (email: string, pass: string) => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      if (!supabase) throw new Error('Supabase is not configured.');
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: pass,
      });

      if (error) {
        throw error;
      }

      if (onShowNotice) {
        onShowNotice('Sign in successful! Welcome to SE-Connect.');
      }
    } catch (err: any) {
      console.warn('[LoginPage] Sign in verification error:', err);
      setErrorMessage(err.message || 'Unable to complete sign in. Please try again.');
    } finally {
      setIsLoading(false);
      setActivePillLogin(null);
    }
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMessage('Please enter your corporate email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }
    await executeLogin(identifier, password);
  };

  const handlePillClick = async (email: string, pass: string, pillKey: string) => {
    setIdentifier(email);
    setPassword(pass);
    setActivePillLogin(pillKey);
    await executeLogin(email, pass);
  };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.heroHeader}>
        <img
          src={DEFAULT_COVER_URL}
          alt="Sabah Electricity High-Voltage Transmission Tower at Sunset with Mount Kinabalu"
          className={styles.heroImage}
          onError={(e) => handleCoverError(e)}
        />
        <div className={styles.heroGradientOverlay} />

        <div className={styles.heroContent}>
          <span className={styles.heroEyebrow}>Internal Staff Portal</span>
          <h1 className={styles.heroTitle}>
            Welcome to <span className={styles.heroBrandHighlight}>SE-Connect</span>
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
              src={DEFAULT_LOGO_URL}
              alt="Sabah Electricity Sdn. Bhd."
              className={styles.brandLogo}
              onError={(e) => handleLogoError(e)}
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
            {isLoading && !activePillLogin ? (
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

        {/* Pilot Quick Access Personas (Zero Emojis, Authentic Vector Icons) */}
        <div className={styles.pilotQuickSection}>
          <div className={styles.pilotQuickHeader}>
            <span className={styles.pilotQuickLabel}>Pilot Quick Access</span>
            <span className={styles.pilotQuickHint}>1-Tap Sign In</span>
          </div>

          <div className={styles.pilotPillsGrid}>
            <button
              type="button"
              className={styles.pilotPillBtn}
              onClick={() => handlePillClick('test@sesb.com.my', 'TestAdmin@2026', 'admin')}
              disabled={isLoading}
            >
              {activePillLogin === 'admin' ? (
                <span className={styles.pilotPillSpinner} aria-hidden="true" />
              ) : (
                <span className={`material-symbols-outlined ${styles.pilotPillIcon}`} aria-hidden="true">
                  shield_person
                </span>
              )}
              <div className={styles.pilotPillMeta}>
                <span className={styles.pilotPillTitle}>ADMIN_USER</span>
                <span className={styles.pilotPillSub}>Super Administrator</span>
              </div>
            </button>

            <button
              type="button"
              className={styles.pilotPillBtn}
              onClick={() => handlePillClick('ceo.office@sesb.com.my', 'CeoOffice@2026', 'ceo')}
              disabled={isLoading}
            >
              {activePillLogin === 'ceo' ? (
                <span className={styles.pilotPillSpinner} aria-hidden="true" />
              ) : (
                <span className={`material-symbols-outlined ${styles.pilotPillIcon}`} aria-hidden="true">
                  corporate_fare
                </span>
              )}
              <div className={styles.pilotPillMeta}>
                <span className={styles.pilotPillTitle}>CEO Office</span>
                <span className={styles.pilotPillSub}>Executive Suite</span>
              </div>
            </button>

            <button
              type="button"
              className={styles.pilotPillBtn}
              onClick={() => handlePillClick('testuser1@sesb.com.my', 'Password123!', 'staff1')}
              disabled={isLoading}
            >
              {activePillLogin === 'staff1' ? (
                <span className={styles.pilotPillSpinner} aria-hidden="true" />
              ) : (
                <span className={`material-symbols-outlined ${styles.pilotPillIcon}`} aria-hidden="true">
                  badge
                </span>
              )}
              <div className={styles.pilotPillMeta}>
                <span className={styles.pilotPillTitle}>testuser1</span>
                <span className={styles.pilotPillSub}>Info & Digital Staff</span>
              </div>
            </button>

            <button
              type="button"
              className={styles.pilotPillBtn}
              onClick={() => handlePillClick('testuser2@sesb.com.my', 'Password123!', 'staff2')}
              disabled={isLoading}
            >
              {activePillLogin === 'staff2' ? (
                <span className={styles.pilotPillSpinner} aria-hidden="true" />
              ) : (
                <span className={`material-symbols-outlined ${styles.pilotPillIcon}`} aria-hidden="true">
                  engineering
                </span>
              )}
              <div className={styles.pilotPillMeta}>
                <span className={styles.pilotPillTitle}>testuser2</span>
                <span className={styles.pilotPillSub}>Operations Staff</span>
              </div>
            </button>
          </div>
        </div>

        <footer className={styles.loginFooter}>
          <p className={styles.footerText}>
            Wisma SE HQ • Sabah Electricity Sdn. Bhd. • Pilot Staging
          </p>
        </footer>
      </main>
    </div>
  );
};
