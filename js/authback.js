/* ── SOLARA — Client-side Auth System ── */

/*
 * NOTE: This is a client-side authentication layer.
 * For production, you MUST implement server-side auth (JWT, sessions, etc.).
 * This provides a reasonable protection layer for demo/staging environments.
 */

const AUTH_KEY = 'solara_session';
const AUTH_ATTEMPTS_KEY = 'solara_login_attempts';
const AUTH_LOCKOUT_KEY = 'solara_lockout_until';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes
const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours

/* Admin credentials — password hash (SHA-256) */
const ADMIN_ACCOUNTS = [
  {
    email: 'admin@solara.com',
    passwordHash: 'b21db0b3e48809245746b89899a6f15eaa46151d428dd19596a00b693a42c680',
    role: 'admin',
    name: 'Administrateur'
  }
];

/* ── SHA-256 hashing via Web Crypto API ── */
async function hashPassword(password) {
  var encoder = new TextEncoder();
  var data = encoder.encode(password);
  var hashBuffer = await crypto.subtle.digest('SHA-256', data);
  var hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
}

/* ── Brute force protection ── */
function getLoginAttempts() {
  return parseInt(localStorage.getItem(AUTH_ATTEMPTS_KEY) || '0');
}

function incrementAttempts() {
  var attempts = getLoginAttempts() + 1;
  localStorage.setItem(AUTH_ATTEMPTS_KEY, String(attempts));
  if (attempts >= MAX_ATTEMPTS) {
    localStorage.setItem(AUTH_LOCKOUT_KEY, String(Date.now() + LOCKOUT_DURATION));
  }
  return attempts;
}

function resetAttempts() {
  localStorage.removeItem(AUTH_ATTEMPTS_KEY);
  localStorage.removeItem(AUTH_LOCKOUT_KEY);
}

function isLockedOut() {
  var lockUntil = parseInt(localStorage.getItem(AUTH_LOCKOUT_KEY) || '0');
  if (lockUntil && Date.now() < lockUntil) {
    return Math.ceil((lockUntil - Date.now()) / 1000);
  }
  if (lockUntil && Date.now() >= lockUntil) {
    resetAttempts();
  }
  return 0;
}

/* ── Session management ── */
function createSession(account) {
  var token = crypto.getRandomValues(new Uint8Array(32));
  var tokenHex = Array.from(token).map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
  var session = {
    token: tokenHex,
    email: account.email,
    role: account.role,
    name: account.name,
    createdAt: Date.now(),
    expiresAt: Date.now() + SESSION_DURATION
  };
  sessionStorage.setItem(AUTH_KEY, JSON.stringify(session));
  return session;
}

function getSession() {
  try {
    var raw = sessionStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    var session = JSON.parse(raw);
    if (Date.now() > session.expiresAt) {
      sessionStorage.removeItem(AUTH_KEY);
      return null;
    }
    return session;
  } catch (e) {
    return null;
  }
}

function destroySession() {
  sessionStorage.removeItem(AUTH_KEY);
}

/* ── Login ── */
async function login(email, password) {
  var lockSeconds = isLockedOut();
  if (lockSeconds > 0) {
    return { success: false, error: 'Trop de tentatives. Réessayez dans ' + Math.ceil(lockSeconds / 60) + ' min.' };
  }

  var hash = await hashPassword(password);
  var account = ADMIN_ACCOUNTS.find(function(a) {
    return a.email.toLowerCase() === email.toLowerCase() && a.passwordHash === hash;
  });

  if (!account) {
    var attempts = incrementAttempts();
    var remaining = MAX_ATTEMPTS - attempts;
    if (remaining <= 0) {
      return { success: false, error: 'Compte verrouillé pendant 5 minutes.' };
    }
    return { success: false, error: 'Email ou mot de passe incorrect. ' + remaining + ' tentative(s) restante(s).' };
  }

  resetAttempts();
  var session = createSession(account);
  return { success: true, session: session };
}

/* ── Logout ── */
function logout() {
  destroySession();
  window.location.href = 'login.html';
}

/* ── Route protection ── */
function requireAuth() {
  var session = getSession();
  if (!session) {
    window.location.href = 'login.html';
    return false;
  }
  return session;
}

function isAuthenticated() {
  return getSession() !== null;
}

/* ── Expose globals ── */
window.login = login;
window.logout = logout;
window.requireAuth = requireAuth;
window.isAuthenticated = isAuthenticated;
window.getSession = getSession;
window.destroySession = destroySession;
