// نصب PWA — اندروید
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
  e.preventDefault();
  deferredInstallPrompt = e;
  const hint = document.getElementById('installHint');
  if (hint) hint.textContent = 'دکمه نصب آماده است — روی «نصب برنامه» بزنید.';
  const btn = document.getElementById('installAppBtn');
  if (btn) btn.disabled = false;
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
  const hint = document.getElementById('installHint');
  const skip = document.getElementById('skipInstallBtn');

  if (btn) {
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      btn.textContent = 'صبر کنید...';
      try {
        if (deferredInstallPrompt) {
          deferredInstallPrompt.prompt();
          const choice = await deferredInstallPrompt.userChoice;
          if (choice && choice.outcome === 'accepted') {
            localStorage.setItem('appInstalled', '1');
            hideInstallOverlay();
            return;
          }
          if (hint) hint.textContent = 'نصب لغو شد. دوباره تلاش کنید یا از منوی کروم نصب کنید.';
        } else {
          if (hint) {
            hint.innerHTML =
              'کروم پنجره نصب نداد.<br>' +
              '۱) منوی <b>⋮</b> بالای کروم را بزنید<br>' +
              '۲) گزینه <b>Install app</b> یا <b>Add to Home screen</b> را بزنید<br>' +
              '۳) اگر نبود، چند ثانیه در صفحه بمانید و دوباره «نصب برنامه» را بزنید';
          }
        }
      } catch (err) {
        if (hint) hint.textContent = 'خطا در نصب. از منوی کروم ⋮ → Install app استفاده کنید.';
      }
      btn.disabled = false;
      btn.textContent = 'نصب برنامه';
    });
  }

  if (skip) {
    skip.addEventListener('click', () => {
      localStorage.setItem('skipInstall', '1');
      hideInstallOverlay();
    });
  }

  if (isAndroid() && !isStandalone() && localStorage.getItem('skipInstall') !== '1') {
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
