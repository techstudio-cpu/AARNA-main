// PWA Install Prompt Handler
(function() {
  let deferredPrompt;
  let installBanner = null;
  const INSTALL_PROMPT_KEY = 'aarna_install_prompt_shown';
  const PROMPT_COOLDOWN_DAYS = 7;

  // Check if we should show the prompt
  function shouldShowPrompt() {
    const lastShown = localStorage.getItem(INSTALL_PROMPT_KEY);
    if (!lastShown) return true;
    
    const lastDate = new Date(parseInt(lastShown));
    const now = new Date();
    const daysDiff = (now - lastDate) / (1000 * 60 * 60 * 24);
    
    return daysDiff >= PROMPT_COOLDOWN_DAYS;
  }

  // Mark prompt as shown
  function markPromptShown() {
    localStorage.setItem(INSTALL_PROMPT_KEY, Date.now().toString());
  }

  // Check if app is already installed
  function isAppInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true;
  }

  // Detect platform
  function getPlatform() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
      return 'ios';
    }
    if (/android/i.test(userAgent)) {
      return 'android';
    }
    if (/Win/.test(navigator.platform)) {
      return 'windows';
    }
    if (/Mac/.test(navigator.platform)) {
      return 'mac';
    }
    return 'other';
  }

  // Create install banner
  function createInstallBanner() {
    const platform = getPlatform();
    
    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.innerHTML = `
      <div class="pwa-install-overlay"></div>
      <div class="pwa-install-modal">
        <button class="pwa-close-btn" aria-label="Close">&times;</button>
        <div class="pwa-icon">
          <svg viewBox="0 0 100 100" width="60" height="60">
            <circle cx="50" cy="50" r="45" fill="#E87722"/>
            <text x="50" y="62" text-anchor="middle" fill="white" font-size="40">☀️</text>
          </svg>
        </div>
        <h3 class="pwa-title">Install Aarna Solars App</h3>
        <p class="pwa-description">Get quick access to solar solutions, quotes, and support right from your home screen!</p>
        
        <div class="pwa-benefits">
          <div class="pwa-benefit">
            <span class="pwa-benefit-icon">⚡</span>
            <span>Faster Access</span>
          </div>
          <div class="pwa-benefit">
            <span class="pwa-benefit-icon">📱</span>
            <span>Works Offline</span>
          </div>
          <div class="pwa-benefit">
            <span class="pwa-benefit-icon">🔔</span>
            <span>Get Updates</span>
          </div>
        </div>
        
        ${platform === 'ios' ? `
          <div class="pwa-ios-instructions">
            <p><strong>To install on iOS:</strong></p>
            <ol>
              <li>Tap the <strong>Share</strong> button <span class="ios-share-icon">⬆️</span></li>
              <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
              <li>Tap <strong>"Add"</strong> to confirm</li>
            </ol>
          </div>
        ` : `
          <button class="pwa-install-btn" id="pwa-install-btn">
            <span class="pwa-install-icon">📲</span>
            Install App
          </button>
        `}
        
        <button class="pwa-later-btn" id="pwa-later-btn">Maybe Later</button>
      </div>
    `;

    // Add styles
    const styles = document.createElement('style');
    styles.textContent = `
      #pwa-install-banner {
        position: fixed;
        inset: 0;
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        animation: pwaFadeIn 0.3s ease;
      }
      
      @keyframes pwaFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes pwaSlideUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      
      .pwa-install-overlay {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(4px);
      }
      
      .pwa-install-modal {
        position: relative;
        background: white;
        border-radius: 1.5rem;
        padding: 2rem;
        max-width: 360px;
        width: 100%;
        text-align: center;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        animation: pwaSlideUp 0.4s ease;
      }
      
      .pwa-close-btn {
        position: absolute;
        top: 0.75rem;
        right: 0.75rem;
        width: 2rem;
        height: 2rem;
        border: none;
        background: #f3f4f6;
        border-radius: 50%;
        font-size: 1.25rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #6b7280;
        transition: all 0.2s;
      }
      
      .pwa-close-btn:hover {
        background: #e5e7eb;
        color: #374151;
      }
      
      .pwa-icon {
        margin-bottom: 1rem;
      }
      
      .pwa-title {
        font-size: 1.25rem;
        font-weight: 700;
        color: #1f2937;
        margin: 0 0 0.5rem 0;
      }
      
      .pwa-description {
        font-size: 0.875rem;
        color: #6b7280;
        margin: 0 0 1.25rem 0;
        line-height: 1.5;
      }
      
      .pwa-benefits {
        display: flex;
        justify-content: center;
        gap: 1rem;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
      }
      
      .pwa-benefit {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.75rem;
        color: #4b5563;
      }
      
      .pwa-benefit-icon {
        font-size: 1.5rem;
      }
      
      .pwa-install-btn {
        width: 100%;
        padding: 0.875rem 1.5rem;
        background: linear-gradient(135deg, #E87722, #d66a1a);
        color: white;
        border: none;
        border-radius: 9999px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        transition: all 0.2s;
        box-shadow: 0 4px 14px rgba(232, 119, 34, 0.4);
      }
      
      .pwa-install-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(232, 119, 34, 0.5);
      }
      
      .pwa-install-btn:active {
        transform: translateY(0);
      }
      
      .pwa-later-btn {
        width: 100%;
        padding: 0.75rem 1.5rem;
        background: transparent;
        color: #6b7280;
        border: none;
        font-size: 0.875rem;
        cursor: pointer;
        margin-top: 0.75rem;
        transition: color 0.2s;
      }
      
      .pwa-later-btn:hover {
        color: #374151;
      }
      
      .pwa-ios-instructions {
        text-align: left;
        background: #f9fafb;
        border-radius: 0.75rem;
        padding: 1rem;
        margin-bottom: 1rem;
      }
      
      .pwa-ios-instructions p {
        margin: 0 0 0.5rem 0;
        font-size: 0.875rem;
        color: #374151;
      }
      
      .pwa-ios-instructions ol {
        margin: 0;
        padding-left: 1.25rem;
        font-size: 0.8125rem;
        color: #4b5563;
      }
      
      .pwa-ios-instructions li {
        margin-bottom: 0.375rem;
      }
      
      .ios-share-icon {
        display: inline-block;
        background: #007AFF;
        color: white;
        width: 1.25rem;
        height: 1.25rem;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        line-height: 1.25rem;
        text-align: center;
      }
      
      @media (max-width: 400px) {
        .pwa-install-modal {
          padding: 1.5rem;
          margin: 0.5rem;
        }
        
        .pwa-benefits {
          gap: 0.5rem;
        }
        
        .pwa-benefit {
          font-size: 0.6875rem;
        }
      }
    `;
    
    document.head.appendChild(styles);
    document.body.appendChild(banner);
    
    return banner;
  }

  // Show install banner
  function showInstallBanner() {
    if (isAppInstalled() || !shouldShowPrompt()) {
      return;
    }

    // Small delay to not interrupt initial page load
    setTimeout(() => {
      installBanner = createInstallBanner();
      
      // Close button
      const closeBtn = installBanner.querySelector('.pwa-close-btn');
      closeBtn.addEventListener('click', hideInstallBanner);
      
      // Later button
      const laterBtn = installBanner.querySelector('#pwa-later-btn');
      laterBtn.addEventListener('click', hideInstallBanner);
      
      // Install button (for non-iOS)
      const installBtn = installBanner.querySelector('#pwa-install-btn');
      if (installBtn) {
        installBtn.addEventListener('click', handleInstallClick);
      }
      
      // Click overlay to close
      const overlay = installBanner.querySelector('.pwa-install-overlay');
      overlay.addEventListener('click', hideInstallBanner);
      
    }, 2000);
  }

  // Hide install banner
  function hideInstallBanner() {
    if (installBanner) {
      installBanner.style.animation = 'pwaFadeIn 0.2s ease reverse';
      setTimeout(() => {
        installBanner.remove();
        installBanner = null;
      }, 200);
      markPromptShown();
    }
  }

  // Handle install click
  async function handleInstallClick() {
    if (!deferredPrompt) {
      // For browsers that don't support beforeinstallprompt
      alert('To install: Use your browser menu and select "Add to Home Screen" or "Install App"');
      hideInstallBanner();
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice;
    console.log('Install prompt outcome:', outcome);
    
    // Clear the deferred prompt
    deferredPrompt = null;
    hideInstallBanner();
  }

  // Listen for beforeinstallprompt event
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Store the event for later use
    deferredPrompt = e;
    // Show our custom install banner
    showInstallBanner();
  });

  // Listen for app installed event
  window.addEventListener('appinstalled', () => {
    console.log('Aarna Solars app installed!');
    hideInstallBanner();
    deferredPrompt = null;
  });

  // For iOS and browsers without beforeinstallprompt
  // Show banner after page load if conditions are met
  window.addEventListener('load', () => {
    const platform = getPlatform();
    
    // For iOS, show the banner with instructions
    if (platform === 'ios' && !isAppInstalled() && shouldShowPrompt()) {
      showInstallBanner();
    }
    
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration.scope);
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error);
        });
    }
  });
})();
