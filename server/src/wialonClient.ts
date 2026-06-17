// Low-level Wialon Local Remote API client.
// Supports per-user tokens: the active token is carried per-request via
// AsyncLocalStorage, and each token gets its own cached session id (sid).
// Falls back to WIALON_TOKEN (env) when the request carries no token.

import { AsyncLocalStorage } from 'async_hooks';
import type { WialonRow } from './types';

const HOST = (process.env.WIALON_HOST || 'https://go.gps.az').replace(/\/+$/, '');
const ENV_TOKEN = process.env.WIALON_TOKEN || '';
const AJAX = `${HOST}/wialon/ajax.html`;

// Wialon error codes meaning "session is gone" -> re-login and retry once.
const SESSION_ERRORS = new Set([1, 4, 5, 7, 1003]);

export const tokenStore = new AsyncLocalStorage<string>();

/** token -> sid */
const sessions = new Map<string, string>();
/** token -> in-flight login (dedupe concurrent logins) */
const logins = new Map<string, Promise<string>>();

export class AuthError extends Error {
  code = 'AUTH';
}

function currentToken(): string {
  return tokenStore.getStore() || ENV_TOKEN;
}

/** Active token for the current request (cache-key safe). */
export function activeToken(): string {
  return currentToken();
}

export function wialonHost(): string {
  return HOST;
}

async function raw(svc: string, params: unknown, sid?: string): Promise<any> {
  const body = new URLSearchParams();
  body.set('svc', svc);
  body.set('params', JSON.stringify(params ?? {}));
  if (sid) body.set('sid', sid);

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 120_000);
  try {
    const res = await fetch(AJAX, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: ctrl.signal,
    });
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function loginToken(token: string): Promise<string> {
  if (!token) throw new AuthError('No Wialon token provided');
  const existing = logins.get(token);
  if (existing) return existing;

  const p = (async () => {
    const d = await raw('token/login', { token }, undefined);
    if (!d || d.error) throw new AuthError(`Wialon login failed (error ${d?.error})`);
    sessions.set(token, d.eid as string);
    return d.eid as string;
  })();
  logins.set(token, p);
  try {
    return await p;
  } finally {
    logins.delete(token);
  }
}

/** Validate a token by logging in; returns basic account info. */
export async function authenticate(token: string): Promise<any> {
  const d = await raw('token/login', { token }, undefined);
  if (!d || d.error) throw new AuthError(`Wialon login failed (error ${d?.error})`);
  sessions.set(token, d.eid as string);
  return d;
}

/** Call a Wialon service for the current request's token, refreshing sid on expiry. */
export async function call(svc: string, params: unknown): Promise<any> {
  const token = currentToken();
  let sid = sessions.get(token);
  if (!sid) sid = await loginToken(token);

  let d = await raw(svc, params, sid);
  if (d && typeof d.error === 'number' && SESSION_ERRORS.has(d.error)) {
    sessions.delete(token);
    sid = await loginToken(token);
    d = await raw(svc, params, sid);
  }
  if (d && typeof d.error === 'number' && d.error !== 0) {
    throw new Error(`Wialon ${svc} error ${d.error}`);
  }
  return d;
}

// ---- higher-level helpers ---------------------------------------------------

export async function searchItems(itemsType: string, flags: number): Promise<any[]> {
  const d = await call('core/search_items', {
    spec: {
      itemsType,
      propName: 'sys_name',
      propValueMask: '*',
      sortType: 'sys_name',
    },
    force: 1,
    flags,
    from: 0,
    to: 0,
  });
  return d.items || [];
}

export interface ExecResultTable {
  name: string;
  label: string;
  rows: number;
  header: string[];
}

export async function execReport(
  resourceId: number,
  templateId: number,
  objectId: number,
  from: number,
  to: number,
): Promise<ExecResultTable[]> {
  const d = await call('report/exec_report', {
    reportResourceId: resourceId,
    reportTemplateId: templateId,
    reportObjectId: objectId,
    reportObjectSecId: 0,
    interval: { flags: 0, from, to },
  });
  return (d?.reportResult?.tables || []) as ExecResultTable[];
}

export async function getResultSubrows(
  tableIndex: number,
  rowIndex: number,
): Promise<WialonRow[]> {
  const d = await call('report/get_result_subrows', { tableIndex, rowIndex });
  return Array.isArray(d) ? (d as WialonRow[]) : [];
}

export async function cleanupResult(): Promise<void> {
  try {
    await call('report/cleanup_result', {});
  } catch {
    /* best-effort */
  }
}

export function hasEnvToken(): boolean {
  return !!ENV_TOKEN;
}
