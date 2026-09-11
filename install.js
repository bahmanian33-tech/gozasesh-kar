// ===== نصب PWA فقط اندروید =====
function isAndroid() {
  return /Android/i.test(navigator.userAgent);
}
function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true
    || document.referrer.includes('android-app://');
}

let deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  if (!isAndroid()) return;
  e.preventDefault();
  deferredInstallPrompt = e;
  showInstallOverlay(true);
});

window.addEventListener('appinstalled', () => {
  localStorage.setItem('appInstalled', '1');
  hideInstallOverlay();
  deferredInstallPrompt = null;
});

function showInstallOverlay() {
  const el = document.getElementById('installOverlay');
  if (!el) return;
  el.classList.add('show');
  const root = document.getElementById('appRoot');
  if (root) root.style.display = 'none';
}

function hideInstallOverlay() {
  const el = document.getElementById('installOverlay');
  if (el) el.classList.remove('show');
  const root = document.getElementById('appRoot');
  if (root) root.style.display = '';
}

function setupInstallUI() {
  const btn = document.getElementById('installAppBtn');
  if (btn) {
    btn.addEventListener('click', async () => {
      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        const choice = await deferredInstallPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          localStorage.setItem('appInstalled', '1');
          hideInstallOverlay();
        }
        deferredInstallPrompt = null;
      } else {
        const hint = document.getElementById('installHint');
        if (hint) {
          hint.textContent = 'منوی کروم (⋮) → Install app / نصب برنامه. اگر نبود چند ثانیه صبر کنید و دوباره بزنید.';
        }
      }
    });
  }

  if (isAndroid() && !isStandalone()) {
    showInstallOverlay();
  } else {
    hideInstallOverlay();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupInstallUI);
} else {
  setupInstallUI();
}
