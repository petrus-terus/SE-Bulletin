import React, { useState } from 'react';
import type { Employee } from '../types/bulletin';
import { ALL_EMPLOYEES } from '../services/mockData';
import { bulletinService } from '../services/bulletinService';
import styles from './LoginPage.module.css';

interface Props {
  onLogin: (employee: Employee) => void;
  onShowNotice?: (message: string) => void;
}

export const LoginPage: React.FC<Props> = ({ onLogin, onShowNotice }) => {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  // Sign In state (Defaults to clean empty inputs)
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Sign Up state (Name, Email, Password - No ID required)
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handle Sign In Submission
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanInput = identifier.trim().toLowerCase();
    if (!cleanInput) {
      setErrorMessage('Please enter your Staff Username, Email, or Staff ID.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      const allUsers = await bulletinService.getProfiles();

      // 1. Check for TEST_USER (Admin)
      if (
        cleanInput === 'test_user' ||
        cleanInput === 'test@sesb.com.my' ||
        cleanInput === 'sesb-test' ||
        cleanInput === 'sesb-1001' ||
        cleanInput === 'irfan@sesb.com.my'
      ) {
        const testUser = allUsers.find((u) => u.name === 'TEST_USER') || ALL_EMPLOYEES[0];
        setIsLoading(false);
        onLogin(testUser);
        return;
      }

      // 2. Check for CEO
      if (
        cleanInput === 'ceo' ||
        cleanInput === 'ceo.office@sesb.com.my' ||
        cleanInput === 'sesb-0001' ||
        cleanInput.includes('yaakob')
      ) {
        const ceoUser = allUsers.find((u) => u.id === 'user-ceo') || ALL_EMPLOYEES[1];
        if (ceoUser) {
          setIsLoading(false);
          onLogin(ceoUser);
          return;
        }
      }

      // 3. Match against all registered employees (from Supabase or local cache)
      const matched = allUsers.find(
        (emp) =>
          emp.employeeId.toLowerCase() === cleanInput ||
          emp.email.toLowerCase() === cleanInput ||
          emp.name.toLowerCase() === cleanInput
      );

      setIsLoading(false);
      if (matched) {
        onLogin(matched);
      } else {
        setErrorMessage('User not found. If this is your first time, please use the "New Staff Sign Up" tab.');
      }
    } catch (err) {
      setIsLoading(false);
      console.warn('[LoginPage] Sign in verification error:', err);
      setErrorMessage('Unable to complete sign in. Please verify your credentials.');
    }
  };

  // Handle Sign Up Submission (Name, Email, Password - No ID required)
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanName = signupName.trim();
    const cleanEmail = signupEmail.trim().toLowerCase();
    const cleanPass = signupPassword.trim();

    if (!cleanName) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (cleanPass.length < 4) {
      setErrorMessage('Password must be at least 4 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      const existingUsers = await bulletinService.getProfiles();
      if (existingUsers.some((u) => u.email.toLowerCase() === cleanEmail)) {
        setIsLoading(false);
        setErrorMessage('This email is already registered. Please sign in instead.');
        return;
      }

      // Create new GeneralStaff user with generated internal SESB Staff ID
      const newStaffId = `SESB-${Math.floor(1000 + Math.random() * 9000)}`;
      const newUser: Employee = {
        id: `user-${Date.now()}`,
        employeeId: newStaffId,
        name: cleanName,
        fullName: cleanName,
        designation: 'Sabah Electricity Staff Officer',
        department: 'Operating',
        email: cleanEmail,
        avatarUrl: '/user_face.png',
        officeLocation: 'Wisma SESB HQ, Kota Kinabalu',
        phoneExtension: `Ext. ${Math.floor(2000 + Math.random() * 5000)}`,
        role: 'GeneralStaff',
        isVerified: true,
        isOnline: true,
        bio: 'Sabah Electricity team member energising Sabah with safety, reliability, and excellence.',
      };

      // Persist to Supabase public.profiles and localStorage cache
      await bulletinService.saveProfile(newUser);

      setIsLoading(false);
      if (onShowNotice) {
        onShowNotice(`Welcome ${cleanName}! Your account (${newStaffId}) is ready.`);
      }

      onLogin(newUser);
    } catch (err) {
      setIsLoading(false);
      console.warn('[LoginPage] Registration error:', err);
      setErrorMessage('Could not complete registration. Please try again.');
    }
  };

  const handleForgotCredentials = () => {
    const msg = 'Password assistance: Please contact Wisma SESB IT Helpdesk at Ext. 4412 or it.helpdesk@sesb.com.my.';
    if (onShowNotice) {
      onShowNotice(msg);
    } else {
      alert(msg);
    }
  };

  return (
    <div className={styles.pageContainer}>
      {/* 1. Hero Header Section (~42% Viewport) */}
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

        {/* Hero Title & Welcome Banner */}
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

      {/* 2. Bottom Sheet Section */}
      <main className={styles.loginSheet}>
        {/* Sheet Top Pull Bar */}
        <div className={styles.sheetHandleBar}>
          <div className={styles.sheetHandle} />
        </div>

        {/* Corporate Brand Identity */}
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
            <h2 className={styles.sheetHeading}>
              {authMode === 'signin' ? 'Staff Login' : 'Staff Sign Up'}
            </h2>
            <p className={styles.sheetSubheading}>
              {authMode === 'signin'
                ? 'Sign in to access corporate bulletins & rosters'
                : 'Create your staff profile (zero ID requirement)'}
            </p>
          </div>
        </div>

        {/* Mode Selector Tabs (Sign In vs Sign Up) */}
        <div className={styles.authTabsContainer}>
          <button
            type="button"
            className={`${styles.authTabBtn} ${authMode === 'signin' ? styles.authTabBtnActive : ''}`}
            onClick={() => {
              setAuthMode('signin');
              setErrorMessage(null);
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
              login
            </span>
            <span>Sign In</span>
          </button>
          <button
            type="button"
            className={`${styles.authTabBtn} ${authMode === 'signup' ? styles.authTabBtnActive : ''}`}
            onClick={() => {
              setAuthMode('signup');
              setErrorMessage(null);
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
              person_add
            </span>
            <span>New Staff Sign Up</span>
          </button>
        </div>

        {/* Error Alert Box */}
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

        {/* 1. SIGN IN FORM */}
        {authMode === 'signin' ? (
          <form onSubmit={handleSignInSubmit} className={styles.formContainer}>
            {/* Identifier Input */}
            <div className={styles.inputGroup}>
              <label htmlFor="staff-identifier" className={styles.inputLabel}>
                Username or Email
              </label>
              <div className={styles.inputFieldWrapper}>
                <span className={`material-symbols-outlined ${styles.inputIcon}`}>
                  person
                </span>
                <input
                  id="staff-identifier"
                  type="text"
                  className={styles.textInput}
                  placeholder="e.g. TEST_USER or name@sesb.com.my"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  autoCapitalize="none"
                  autoCorrect="off"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className={styles.inputGroup}>
              <div className={styles.inputLabelRow}>
                <label htmlFor="staff-password" className={styles.inputLabel}>
                  Password
                </label>
                <button
                  type="button"
                  className={styles.forgotLink}
                  onClick={handleForgotCredentials}
                >
                  Need Help?
                </button>
              </div>
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

            {/* Remember Device Toggle */}
            <label className={styles.rememberRow}>
              <input
                type="checkbox"
                className={styles.rememberCheckbox}
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className={styles.rememberText}>Keep me logged in on this smartphone</span>
            </label>

            {/* Submit Button */}
            <button
              type="submit"
              className={styles.signInBtn}
              disabled={isLoading}
            >
              {isLoading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    arrow_forward
                  </span>
                </>
              )}
            </button>

            {/* Quick Demo Credentials Pill (for Pilot evaluators) */}
            <div className={styles.demoFillContainer}>
              <button
                type="button"
                className={styles.demoFillBtn}
                onClick={() => {
                  setIdentifier('TEST_USER');
                  setPassword('TestAdmin@2026');
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                  key
                </span>
                <span>Auto-fill Demo Account (TEST_USER)</span>
              </button>
            </div>
          </form>
        ) : (
          /* 2. SIGN UP FORM (Name, Email, Password - No ID Required) */
          <form onSubmit={handleSignUpSubmit} className={styles.formContainer}>
            {/* Full Name */}
            <div className={styles.inputGroup}>
              <label htmlFor="signup-name" className={styles.inputLabel}>
                Full Name
              </label>
              <div className={styles.inputFieldWrapper}>
                <span className={`material-symbols-outlined ${styles.inputIcon}`}>
                  badge
                </span>
                <input
                  id="signup-name"
                  type="text"
                  className={styles.textInput}
                  placeholder="e.g. Dayang Nurul Ain"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  autoCapitalize="words"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className={styles.inputGroup}>
              <label htmlFor="signup-email" className={styles.inputLabel}>
                Email
              </label>
              <div className={styles.inputFieldWrapper}>
                <span className={`material-symbols-outlined ${styles.inputIcon}`}>
                  mail
                </span>
                <input
                  id="signup-email"
                  type="email"
                  className={styles.textInput}
                  placeholder="e.g. name@sesb.com.my or name@email.com"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  autoCapitalize="none"
                  autoCorrect="off"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className={styles.inputGroup}>
              <label htmlFor="signup-password" className={styles.inputLabel}>
                Create Password
              </label>
              <div className={styles.inputFieldWrapper}>
                <span className={`material-symbols-outlined ${styles.inputIcon}`}>
                  lock
                </span>
                <input
                  id="signup-password"
                  type={showSignupPassword ? 'text' : 'password'}
                  className={styles.textInput}
                  placeholder="Minimum 4 characters"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className={styles.revealToggleBtn}
                  onClick={() => setShowSignupPassword(!showSignupPassword)}
                  aria-label={showSignupPassword ? 'Hide password' : 'Show password'}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                    {showSignupPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Submit Sign Up Button */}
            <button
              type="submit"
              className={styles.signInBtn}
              style={{ background: 'linear-gradient(135deg, #1A7A5A 0%, #0055A4 100%)' }}
              disabled={isLoading}
            >
              {isLoading ? (
                <span>Setting up account...</span>
              ) : (
                <>
                  <span>Create Account & Enter Bulletin</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    how_to_reg
                  </span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Subdued Corporate Footer */}
        <footer className={styles.loginFooter}>
          <p className={styles.footerText}>
            Wisma SESB HQ • Sabah Electricity Sdn. Bhd. • Pilot Staging
          </p>
        </footer>
      </main>
    </div>
  );
};
