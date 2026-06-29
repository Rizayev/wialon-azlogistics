import { clearToken, getToken } from './auth';
import type {
  Group,
  ReportParams,
  RunResult,
  TemplateInfo,
  Unit,
  ViewMode,
} from './types';

export class AuthError extends Error {
  code = 'AUTH';
}

function authHeaders(json = false): Record<string, string> {
  const h: Record<string, string> = {};
  const t = getToken();
  if (t) h['X-Wialon-Token'] = t;
  if (json) h['Content-Type'] = 'application/json';
  return h;
}

async function handle(res: Response): Promise<any> {
  if (res.status === 401) {
    clearToken();
    throw new AuthError('Сессия истекла, требуется повторный вход');
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || res.statusText);
  }
  return res.json();
}

export async function validateToken(token: string): Promise<{ user?: string }> {
  const res = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  return handle(res);
}

export async function fetchUnits(): Promise<Unit[]> {
  return (await handle(await fetch('/api/units', { headers: authHeaders() }))).units;
}

export async function fetchGroups(): Promise<Group[]> {
  return (await handle(await fetch('/api/groups', { headers: authHeaders() }))).groups;
}

export async function fetchTemplates(): Promise<{ templates: TemplateInfo[]; mergedId: number }> {
  return handle(await fetch('/api/templates', { headers: authHeaders() }));
}

export async function runReport(
  params: ReportParams,
  templateId: number,
  lang: string,
): Promise<RunResult> {
  const res = await fetch('/api/run', {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify({ ...params, templateId, lang }),
  });
  return handle(res);
}

export async function exportXlsx(
  params: ReportParams,
  viewMode: ViewMode,
  lang: string,
  templateId: number,
): Promise<void> {
  const res = await fetch('/api/export', {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify({ ...params, viewMode, lang, templateId }),
  });
  if (res.status === 401) {
    clearToken();
    throw new AuthError('Сессия истекла, требуется повторный вход');
  }
  if (!res.ok) throw new Error('export failed');
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'xronologiya.xlsx';
  a.click();
  URL.revokeObjectURL(a.href);
}
