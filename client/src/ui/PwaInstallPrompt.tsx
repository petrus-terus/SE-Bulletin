import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './PwaInstallPrompt.module.css';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos] = useState(() => {
    if (typeof window === 'undefined') return false;
    const ua = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(ua) && !('MSStream' in window);
  });
  const [isVisible, setIsVisible] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    // 1. Check if already running in standalone PWA mode
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    if (isStandalone) return;

    const ua = window.navigator.userAgent.toLowerCase();

    // 3. Reveal banner gently after 1.2s on mobile devices
    const isMobile = /android|iphone|ipad|ipod|mobile/.test(ua) || window.innerWidth <= 768;
    if (isMobile) {
      const timer = setTimeout(() => setIsVisible(true), 1200);

      const handleBeforeInstall = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        setIsVisible(true);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstall);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      };
    }

    // Desktop Chrome / Edge listener
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  if (!isVisible) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsVisible(false);
      }
      setDeferredPrompt(null);
    } else {
      setShowInstructions(true);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setShowInstructions(false);
  };

  return (
    <>
      <div className={styles.installBanner} role="dialog" aria-label="Install Sabah Electricity App">
        <div className={styles.bannerContent}>
          <div className={styles.appIconWrapper}>
            <img
              src="/sesb_app_icon.png"
              alt="SE Bulletin Icon"
              className={styles.appIcon}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/favicon.svg';
              }}
            />
          </div>

          <div className={styles.bannerText}>
            <span className={styles.bannerTitle}>Install SE Bulletin</span>
            <span className={styles.bannerSubtitle}>
              {isIos
                ? 'Add to Home Screen for best experience'
                : 'Fast offline access & home screen widget'}
            </span>
          </div>
        </div>

        <div className={styles.actionsGroup}>
          <button
            type="button"
            className={styles.installBtn}
            onClick={handleInstallClick}
            aria-label={isIos ? 'Show iOS Installation Guide' : 'Install SE Bulletin App'}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
              {isIos ? 'help_outline' : 'download'}
            </span>
            <span>{isIos ? 'Install Guide' : 'Install'}</span>
          </button>

          <button
            type="button"
            className={styles.dismissBtn}
            onClick={handleDismiss}
            aria-label="Dismiss install banner"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              close
            </span>
          </button>
        </div>
      </div>

      {/* Manual Step-by-Step Instructions Modal (Portaled to document.body) */}
      {showInstructions &&
        createPortal(
          <div className={styles.instructionsOverlay} onClick={() => setShowInstructions(false)}>
            <div className={styles.instructionsCard} onClick={(e) => e.stopPropagation()}>
              <div className={styles.instructionsHeader}>
                <div className={styles.instructionsHeaderLeft}>
                  <img
                    src="/sesb_app_icon.png"
                    alt=""
                    className={styles.modalAppIcon}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/favicon.svg';
                    }}
                  />
                  <div>
                    <h3 className={styles.instructionsTitle}>
                      {isIos ? 'Install on iPhone / iPad' : 'Install on Android / Chrome'}
                    </h3>
                    <p className={styles.instructionsSubtitle}>Sabah Electricity Corporate PWA</p>
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.instructionsCloseBtn}
                  onClick={() => setShowInstructions(false)}
                  aria-label="Close installation guide"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                    close
                  </span>
                </button>
              </div>

              {isIos ? (
                <div className={styles.iosInstructionBody}>
                  <div className={styles.stepsList}>
                    {/* Step 1 */}
                    <div className={styles.stepItem}>
                      <div className={styles.stepNumberBadge}>1</div>
                      <div className={styles.stepContent}>
                        <div className={styles.stepTitleRow}>
                          <span className={styles.stepTitle}>Tap the Share button in Safari</span>
                          <span className={styles.iosIconPill}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#007AFF' }}>
                              ios_share
                            </span>
                          </span>
                        </div>
                        <p className={styles.stepDesc}>
                          Look at the navigation bar at the very bottom of your iPhone screen and tap the square icon with an upward arrow.
                        </p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className={styles.stepItem}>
                      <div className={styles.stepNumberBadge}>2</div>
                      <div className={styles.stepContent}>
                        <div className={styles.stepTitleRow}>
                          <span className={styles.stepTitle}>Tap &ldquo;Add to Home Screen&rdquo;</span>
                          <span className={styles.iosIconPill}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#1E293B' }}>
                              add_box
                            </span>
                          </span>
                        </div>
                        <p className={styles.stepDesc}>
                          Scroll down through the share options list and tap the <strong>Add to Home Screen</strong> row.
                        </p>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className={styles.stepItem}>
                      <div className={styles.stepNumberBadge}>3</div>
                      <div className={styles.stepContent}>
                        <div className={styles.stepTitleRow}>
                          <span className={styles.stepTitle}>Tap &ldquo;Add&rdquo; in Top Right</span>
                          <span className={styles.iosAddPill}>Add</span>
                        </div>
                        <p className={styles.stepDesc}>
                          Confirm by tapping <strong>Add</strong> at the top right of your screen. The official Sabah Electricity icon will appear on your home screen!
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Safari Pointer Callout */}
                  <div className={styles.safariPointerBox}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#007AFF' }}>
                      arrow_downward
                    </span>
                    <span>The Share button is at the bottom of your Safari browser</span>
                  </div>
                </div>
              ) : (
                <div className={styles.stepsList}>
                  <div className={styles.stepItem}>
                    <div className={styles.stepNumberBadge}>1</div>
                    <div className={styles.stepContent}>
                      <span className={styles.stepTitle}>Tap Chrome Menu (⋮)</span>
                      <p className={styles.stepDesc}>Tap the three dots in the top-right corner of Chrome.</p>
                    </div>
                  </div>
                  <div className={styles.stepItem}>
                    <div className={styles.stepNumberBadge}>2</div>
                    <div className={styles.stepContent}>
                      <span className={styles.stepTitle}>Select &ldquo;Install app&rdquo;</span>
                      <p className={styles.stepDesc}>Tap &ldquo;Install app&rdquo; or &ldquo;Add to Home screen&rdquo;.</p>
                    </div>
                  </div>
                  <div className={styles.stepItem}>
                    <div className={styles.stepNumberBadge}>3</div>
                    <div className={styles.stepContent}>
                      <span className={styles.stepTitle}>Confirm Install</span>
                      <p className={styles.stepDesc}>Tap <strong>Install</strong> on the prompt to place the app on your home screen.</p>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="button"
                className={styles.gotItBtn}
                onClick={() => setShowInstructions(false)}
              >
                Got it
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
