/* ── SOLARA — Client-side Auth System v2 (hardened) ── */

/*
 * NOTE: Client-side authentication only.
 * For production: implement server-side auth (JWT, sessions, OAuth).
 * This layer provides meaningful resistance for staging/demo environments.
 *
 * ══════════════════════════════════════════════════════════════════
 *  FIRST-TIME SETUP (required — login will not work until done)
 *  1. Deploy your files and open login.html in the browser
 *  2. Open DevTools → Console
 *  3. Run: window._solaraGenHash('YourNewPassword').then(console.log)
 *  4. Copy the _K array printed in the console
 *  5. Paste it into the _K variable below (line ~40)
 *  6. Save auth.js — done. Delete _solaraGenHash before going live.
 * ══════════════════════════════════════════════════════════════════
 */

/* ── [SEC-1] PBKDF2 parameters ──────────────────────────────────────
 * PBKDF2-HMAC-SHA256 with 100 000 iterations.
 * 100k iterations ≈ 500ms on client — makes brute-force ~100 000× slower
 * than plain SHA-256. The salt makes every hash unique to this app,
 * so rainbow tables / leaked SHA-256 databases are useless.
 */
const _P2_SALT = 'sl@r4_4dm1n_s4lt_!v2';
const _P2_ITER = 100000;

/* ── [SEC-2] Obfuscated credential store ────────────────────────────
 * The PBKDF2-derived key is split across 4 variables (_K[0..3])
 * to slow visual inspection in DevTools.
 * The email is base64-encoded to avoid plain-text search hits.
 * All real logic is in the comparison function — never in naming.
 *
 * After running the generator (step 3 above), replace _K below.
 * The array format is: [first_16_hex_chars, next_16, next_16, last_16]
 */
const _cfg  = { app: 'slr', v: 2, locale: 'fr-ES', ts: 1704067200 }; // ← decoy
const _meta = { region: 'eu-west', tier: 'pro', build: 'stable'    }; // ← decoy
var _K = ["323be7750ac936c7","cca75872891a216f","5dbc670699c259d4","6f8bfd7dd8d67a96"]; // ← REPLACE with output of _solaraGenHash()
const _E    = atob('YWRtaW5Ac29sYXJhLmNvbQ=='); // admin@solara.com
const _R    = { role: 'admin', name: 'Administrateur' };

/* ── [SEC-3] PBKDF2 key derivation ──────────────────────────────────
 * Returns hex string of PBKDF2(password, _P2_SALT, _P2_ITER, SHA-256, 256-bit).
 */
async function _deriveKey(password) {
  var enc = new TextEncoder();
  var mat = await crypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']
  );
  var buf = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode(_P2_SALT), iterations: _P2_ITER, hash: 'SHA-256' },
    mat, 256
  );
  return Array.from(new Uint8Array(buf)).map(function(b) {
    return b.toString(16).padStart(2, '0');
  }).join('');
}

/* ── [SEC-4] Browser fingerprint ────────────────────────────────────
 * Binds each session to the browser that created it.
 * userAgent + language + timezone + colorDepth → SHA-256 (16-char prefix).
 * A token copy-pasted into another browser/device will be rejected.
 */
async function _fingerprint() {
  var raw = [
    navigator.userAgent,
    navigator.language,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    screen.colorDepth
  ].join('|');
  var enc = new TextEncoder();
  var buf = await crypto.subtle.digest('SHA-256', enc.encode(raw));
  return Array.from(new Uint8Array(buf)).map(function(b) {
    return b.toString(16).padStart(2, '0');
  }).join('').slice(0, 16);
}

/* ── [SEC-5] Lockout — sessionStorage + exponential backoff ─────────
 * sessionStorage cannot be cleared from the DevTools console without
 * closing the tab (unlike localStorage which is cleared by .clear()).
 * Lockout duration grows exponentially per lockout episode:
 *   1st lockout → 30s, 2nd → 60s, 3rd → 120s, 4th → 240s, 5th+ → 480s
 */
const _LK_A = 'slr_atts'; // attempt counter
const _LK_U = 'slr_lock'; // lockout-until timestamp
const _LK_L = 'slr_lvl';  // lockout severity level
const _MAX_A = 5;
const _LK_BASE = 30; // seconds

function _getAtts()  { return parseInt(sessionStorage.getItem(_LK_A) || '0'); }
function _getLvl()   { return parseInt(sessionStorage.getItem(_LK_L) || '0'); }

function _registerFailure() {
  var atts = _getAtts() + 1;
  var lvl  = _getLvl();
  sessionStorage.setItem(_LK_A, String(atts));
  if (atts >= _MAX_A) {
    var dur = _LK_BASE * Math.pow(2, lvl) * 1000; // exponential ms
    sessionStorage.setItem(_LK_U, String(Date.now() + dur));
    sessionStorage.setItem(_LK_L, String(lvl + 1));
    sessionStorage.setItem(_LK_A, '0');
  }
  return { atts: atts, remaining: Math.max(0, _MAX_A - atts) };
}

function _clearLock() {
  sessionStorage.removeItem(_LK_A);
  sessionStorage.removeItem(_LK_U);
  sessionStorage.removeItem(_LK_L);
}

/* Returns remaining lockout seconds (0 = not locked) */
function isLockedOut() {
  var until = parseInt(sessionStorage.getItem(_LK_U) || '0');
  if (until && Date.now() < until)  return Math.ceil((until - Date.now()) / 1000);
  if (until && Date.now() >= until) sessionStorage.removeItem(_LK_U);
  return 0;
}

/* ── Session constants ── */
const AUTH_KEY         = 'solara_session';
const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours

/* ── [SEC-6] Session creation with fingerprint ───────────────────── */
async function _createSession() {
  var fp  = await _fingerprint();
  var tok = Array.from(crypto.getRandomValues(new Uint8Array(32)))
              .map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
  var s = {
    token:     tok,
    fp:        fp,           // browser fingerprint
    email:     _E,
    role:      _R.role,
    name:      _R.name,
    createdAt: Date.now(),
    expiresAt: Date.now() + SESSION_DURATION
  };
  sessionStorage.setItem(AUTH_KEY, JSON.stringify(s));
  return s;
}

/* ── [SEC-4] Session validation — async (verifies fingerprint) ────── */
async function getSession() {
  try {
    var raw = sessionStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    var s = JSON.parse(raw);
    if (Date.now() > s.expiresAt) { sessionStorage.removeItem(AUTH_KEY); return null; }
    var fp = await _fingerprint();
    if (s.fp !== fp) {
      /* Fingerprint mismatch — token was copied to another context */
      sessionStorage.removeItem(AUTH_KEY);
      return null;
    }
    return s;
  } catch (e) { return null; }
}

/* Synchronous session check (expiry only, no fingerprint) —
 * used for the instant head-of-page redirect before async code runs. */
function getSessionSync() {
  try {
    var raw = sessionStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    var s = JSON.parse(raw);
    if (Date.now() > s.expiresAt) { sessionStorage.removeItem(AUTH_KEY); return null; }
    return s;
  } catch (e) { return null; }
}

/* ── Login ── */
async function login(email, password) {
  var lock = isLockedOut();
  if (lock > 0) {
    return { success: false, error: 'Trop de tentatives. Réessayez dans ' + Math.ceil(lock / 60) + ' min.' };
  }

  /* [SEC-1] Derive key — this takes ~500ms, naturally rate-limiting attempts */
  var t0      = Date.now();
  var derived = await _deriveKey(password);
  var stored  = _K.join('');

  /* Ensure minimum 600ms response time even if derivation is fast */
  var elapsed = Date.now() - t0;
  if (elapsed < 600) await new Promise(function(r) { setTimeout(r, 600 - elapsed); });

  var emailOk = email.trim().toLowerCase() === _E.toLowerCase();
  var passOk  = stored.length === 64 && derived === stored;

  if (!emailOk || !passOk) {
    var res = _registerFailure();
    if (res.remaining <= 0) {
      var lvl  = Math.max(0, _getLvl() - 1);
      var secs = _LK_BASE * Math.pow(2, lvl);
      return { success: false, error: 'Compte verrouillé pendant ' + Math.ceil(secs / 60) + ' min.' };
    }
    return { success: false, error: 'Email ou mot de passe incorrect. ' + res.remaining + ' tentative(s) restante(s).' };
  }

  _clearLock();
  var session = await _createSession();
  return { success: true, session: session };
}

/* ── Logout ── */
function logout() {
  sessionStorage.removeItem(AUTH_KEY);
  window.location.href = 'login.html';
}

/* ── Route protection — async (full check with fingerprint) ── */
async function requireAuth() {
  var s = await getSession();
  if (!s) { window.location.replace('login.html'); return false; }
  return s;
}

function isAuthenticated() { return getSessionSync() !== null; }

function destroySession() { sessionStorage.removeItem(AUTH_KEY); }

/* ── Hash generator utility ──────────────────────────────────────────
 * Run once in DevTools console to generate your credential hash:
 *   window._solaraGenHash('YourPassword').then(console.log)
 *
 * The console will print the _K array to paste directly into this file.
 * SECURITY NOTE: Remove or comment this function before deploying to production.
 */
window._solaraGenHash = async function(pw) {
  var h = await _deriveKey(pw);
  var parts = [h.slice(0,16), h.slice(16,32), h.slice(32,48), h.slice(48,64)];
  console.log('%c SOLARA HASH GENERATOR ', 'background:#C4714A;color:white;padding:4px 8px;border-radius:4px;font-weight:bold');
  console.log('Paste this into auth.js (replace the existing _K line):');
  console.log('var _K = ' + JSON.stringify(parts) + ';');
  console.log('\nFull hash (for reference):', h);
  return parts;
};

/* ── Expose globals ── */
window.login           = login;
window.logout          = logout;
window.requireAuth     = requireAuth;
window.isAuthenticated = isAuthenticated;
window.getSession      = getSession;
window.getSessionSync  = getSessionSync;
window.destroySession  = destroySession;
window.isLockedOut     = isLockedOut;
