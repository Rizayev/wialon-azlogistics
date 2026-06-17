// Browser-side Wialon login flow.
// 1. Redirect user to <host>/login.html?...&redirect_uri=<app>
// 2. Wialon redirects back with ?access_token=... -> stored in localStorage
// 3. Token is sent to our server (X-Wialon-Token) on every /api call,
//    and lives in the browser until it stops working -> re-login.

const KEY = 'wialon_token';

export interface AppConfig {
  host: string;
  requireAuth: boolean;
}

let configCache: AppConfig | null = null;

export async function getConfig(): Promise<AppConfig> {
  if (configCache) return configCache;
  const res = await fetch('/api/config');
  configCache = await res.json();
  return configCache!;
}

export function getToken(): string | null {
  return localStorage.getItem(KEY);
}

export function setToken(t: string): void {
  localStorage.setItem(KEY, t);
}

export function clearToken(): void {
  localStorage.removeItem(KEY);
}

/** Read access_token from the redirect URL (query or hash) and persist it. */
export function captureTokenFromUrl(): string | null {
  const search = window.location.search.replace(/^\?/, '');
  const hash = window.location.hash.replace(/^#/, '');
  const params = new URLSearchParams(search || hash);
  const t = params.get('access_token');
  if (t) {
    setToken(t);
    window.history.replaceState({}, document.title, window.location.pathname);
    return t;
  }
  return null;
}

/** Send the user to the Wialon hosted login page. */
export async function redirectToLogin(): Promise<void> {
  const cfg = await getConfig();
  const redirect = window.location.origin + window.location.pathname;
  const url =
    `${cfg.host}/login.html?client_id=${encodeURIComponent('WialonAZ')}` +
    `&access_type=-1&activation_time=0&duration=0&flags=0x1` +
    `&response_type=token&redirect_uri=${encodeURIComponent(redirect)}`;
  window.location.href = url;
}

export function logout(): void {
  clearToken();
  redirectToLogin();
}
