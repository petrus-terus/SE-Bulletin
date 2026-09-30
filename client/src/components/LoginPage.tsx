import React, { useState } from 'react';
import type { Employee } from '../types/bulletin';
import { ALL_EMPLOYEES } from '../services/mockData';
import styles from './LoginPage.module.css';

interface Props {
  onLogin: (employee: Employee) => void;
  onShowNotice?: (message: string) => void;
}

export const LoginPage: React.FC<Props> = ({ onLogin, onShowNotice }) => {
  const [identifier, setIdentifier] = useState('SESB-1001');
  const [password, setPassword] = useState('SabahGrid2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanInput = identifier.trim().toLowerCase();
    if (!cleanInput) {
      setErrorMessage('Please enter your Staff ID or corporate email.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your intranet password.');
      return;
    }

    setIsLoading(true);

    // Simulate authentic enterprise directory authentication
    setTimeout(() => {
      // Find matching employee by ID, email, or name
      const matched = ALL_EMPLOYEES.find(
        (emp) =>
          emp.employeeId.toLowerCase() === cleanInput ||
          emp.email.toLowerCase() === cleanInput ||
          emp.name.toLowerCase().includes(cleanInput)
      );

      setIsLoading(false);

      if (matched) {
        onLogin(matched);
      } else {
        // Fallback demo employee for any custom SESB ID entered by staff
        const customEmployee: Employee = {
          id: `user-${Date.now()}`,
          employeeId: identifier.toUpperCase().startsWith('SESB-')
            ? identifier.toUpperCase()
            : `SESB-${Math.floor(1000 + Math.random() * 9000)}`,
          name: identifier.includes('@')
            ? identifier.split('@')[0].replace('.', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
            : `SESB Staff (${identifier})`,
          designation: 'Sabah Electricity Officer',
          department: 'Operating',
          email: identifier.includes('@') ? identifier : `${cleanInput}@sesb.com.my`,
          avatarUrl: '/user_face.png',
          officeLocation: 'Wisma SESB HQ, Kota Kinabalu',
          phoneExtension: 'Ext. 4100',
          role: 'GeneralStaff',
          isVerified: true,
          isOnline: true,
          bio: 'Sabah Electricity staff member.',
        };
        onLogin(customEmployee);
      }
    }, 450);
  };

  const handleQuickSelectPersona = (emp: Employee) => {
    setIdentifier(emp.employeeId);
    setPassword('SabahGrid2026!');
    setErrorMessage(null);
  };

  const handleForgotCredentials = () => {
    if (onShowNotice) {
      onShowNotice('Password reset request: Please contact Wisma SESB IT Helpdesk at Ext. 4412.');
    } else {
      alert('Password reset request: Please contact Wisma SESB IT Helpdesk at Ext. 4412.');
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

        {/* Top Telemetry & Status Bar */}
        <div className={styles.heroTopRow}>
          <div className={styles.telemetryPill}>
            <span className={styles.pulseBeacon} />
            <span className="font-mono tabular-nums">Grid Live (50.02 Hz)</span>
          </div>

          <div className={styles.intranetBadge}>
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
              lock
            </span>
            <span>Intranet Secure</span>
          </div>
        </div>

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

      {/* 2. Bottom Sheet Section (~58% Viewport) */}
      <main className={styles.loginSheet}>
        {/* Sheet Top Pull Bar */}
        <div className={styles.sheetHandleBar}>
          <div className={styles.sheetHandle} />
        </div>

        {/* Sabah Electricity Corporate Brand Identity */}
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
            <p className={styles.sheetSubheading}>Access bulletins, rosters & official circulars</p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className={styles.formContainer}>
          {errorMessage && (
            <div
              style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FCA5A5',
                color: '#991B1B',
                fontSize: '12px',
                padding: '8px 12px',
                borderRadius: '8px',
                fontWeight: 500,
              }}
            >
              {errorMessage}
            </div>
          )}

          {/* Identifier Input (Staff ID or Corporate Email) */}
          <div className={styles.inputGroup}>
            <label htmlFor="staff-identifier" className={styles.inputLabel}>
              Staff ID or Corporate Email
            </label>
            <div className={styles.inputFieldWrapper}>
              <span className={`material-symbols-outlined ${styles.inputIcon}`}>
                badge
              </span>
              <input
                id="staff-identifier"
                type="text"
                className={styles.textInput}
                placeholder="e.g. SESB-1001 or name@sesb.com.my"
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
                Forgot?
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
                placeholder="Enter your intranet password"
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

          {/* Primary Sign In Button */}
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
        </form>

        {/* Demo Persona Quick-Switch Drawer (Perfect for executive demonstration) */}
        <div className={styles.demoHintBox}>
          <div className={styles.demoHintHeader}>
            <span className="material-symbols-outlined" style={{ fontSize: '15px', color: '#0055A4' }}>
              switch_account
            </span>
            <span>Quick Demo Switcher (Tap to test persona):</span>
          </div>
          <div className={styles.demoChipsRow}>
            {ALL_EMPLOYEES.slice(0, 5).map((emp) => (
              <button
                key={emp.id}
                type="button"
                className={styles.demoChip}
                onClick={() => handleQuickSelectPersona(emp)}
                title={`Log in as ${emp.name} (${emp.designation})`}
              >
                {emp.name.split(' ')[0]} ({emp.employeeId})
              </button>
            ))}
          </div>
        </div>

        {/* Subdued Corporate Footer */}
        <footer className={styles.loginFooter}>
          <p className={styles.footerText}>
            Wisma SESB HQ • Sabah Electricity Sdn. Bhd. • PWA v2.4 (Enterprise POC)
          </p>
        </footer>
      </main>
    </div>
  );
};
