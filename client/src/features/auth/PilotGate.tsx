import React, { useState } from 'react';
import styles from './PilotGate.module.css';

interface Props {
  onUnlock: () => void;
}

export const PILOT_GATE_PASSCODE = 'SEBULLETIN@2026';

export const PilotGate: React.FC<Props> = ({ onUnlock }) => {
  const [passcode, setPasscode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanInput = passcode.trim();
    if (!cleanInput) {
      setError('Please enter the confidential pilot access passcode.');
      return;
    }

    setIsSubmitting(true);

    // Verify passcode against approved master secret: SEBULLETIN@2026
    setTimeout(() => {
      setIsSubmitting(false);
      if (cleanInput.toUpperCase() === PILOT_GATE_PASSCODE.toUpperCase()) {
        try {
          localStorage.setItem('sesb_pilot_unlocked', 'true');
        } catch (err) {
          console.warn('[PilotGate] Could not write to localStorage:', err);
        }
        onUnlock();
      } else {
        setError('Incorrect passcode. Access is restricted to authorized Sabah Electricity pilot testers.');
      }
    }, 300);
  };

  return (
    <div className={styles.gateContainer}>
      {/* Background with Mount Kinabalu & Grid Horizon */}
      <img
        src="/grid_horizon_hero.jpg"
        alt="Sabah Electricity High-Voltage Transmission Line"
        className={styles.heroBackdrop}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = '/mock-images/image1.png';
        }}
      />
      <div className={styles.gradientOverlay} />

      {/* Security Gate Card */}
      <div className={styles.cardSurface}>
        <div className={styles.logoWrapper}>
          <img
            src="/sesb_logo.png"
            alt="Sabah Electricity Sdn. Bhd."
            className={styles.logoImage}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/sabah_electricity_logo.png';
            }}
          />
        </div>

        <div className={styles.badgeRow}>
          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
            encrypted
          </span>
          <span>Confidential Pilot Environment</span>
        </div>

        <h1 className={styles.gateTitle}>SE-Bulletin Access</h1>
        <p className={styles.gateSubtitle}>
          This internal prototype is restricted to authorized Sabah Electricity staff. Please enter the pilot access passcode to proceed.
        </p>

        <form onSubmit={handleSubmit} className={styles.gateForm}>
          {error && (
            <div className={styles.errorMessage}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', flexShrink: 0 }}>
                error
              </span>
              <span>{error}</span>
            </div>
          )}

          <div className={styles.inputGroup}>
            <label htmlFor="pilot-passcode" className={styles.inputLabel}>
              Security Passcode
            </label>
            <div className={styles.inputWrapper}>
              <span className={`material-symbols-outlined ${styles.inputIcon}`}>
                key
              </span>
              <input
                id="pilot-passcode"
                type={showPassword ? 'text' : 'password'}
                className={styles.passcodeInput}
                placeholder="Enter pilot passcode"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                autoFocus
                required
              />
              <button
                type="button"
                className={styles.toggleVisibilityBtn}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide passcode' : 'Show passcode'}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            className={styles.unlockBtn}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span>Verifying Passcode...</span>
            ) : (
              <>
                <span>Unlock SE-Connect</span>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  lock_open
                </span>
              </>
            )}
          </button>
        </form>

        <div className={styles.footerHint}>
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
            security
          </span>
          <span>Sabah Electricity Sdn. Bhd. • Internal Staging</span>
        </div>
      </div>
    </div>
  );
};
