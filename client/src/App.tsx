import { useEffect, useMemo, useState } from 'react';
import {
  AuthError,
  exportXlsx,
  fetchGroups,
  fetchUnits,
  runReport,
  validateToken,
} from './api';
import { captureTokenFromUrl, getConfig, getToken, logout } from './auth';
import type {
  Group,
  ReportParams,
  ShowFilter,
  Unit,
  UnitReport,
  ViewMode,
} from './types';
import { Toolbar } from './components/Toolbar';
import { Sidebar } from './components/Sidebar';
import { ReportView } from './components/ReportView';
import { Login } from './components/Login';

const TZ_OFFSET = 4 * 3600; // account timezone (Azerbaijan, UTC+4)

/** "2026-06-17T00:00" (account-tz wall clock) -> epoch seconds. */
function toEpoch(local: string): number {
  const [d, t] = local.split('T');
  const [y, mo, da] = d.split('-').map(Number);
  const [h, mi] = t.split(':').map(Number);
  return Math.floor(Date.UTC(y, mo - 1, da, h, mi) / 1000) - TZ_OFFSET;
}

function todayLocal(time: string): string {
  const now = new Date();
  const az = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + TZ_OFFSET * 1000);
  const y = az.getFullYear();
  const m = String(az.getMonth() + 1).padStart(2, '0');
  const d = String(az.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}T${time}`;
}

type AuthState = 'checking' | 'login' | 'ready';

export function App() {
  const [auth, setAuth] = useState<AuthState>('checking');
  const [user, setUser] = useState<string | undefined>(undefined);

  const [units, setUnits] = useState<Unit[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selected, setSelected] = useState<number[]>([]);

  const [from, setFrom] = useState(() => todayLocal('00:00'));
  const [to, setTo] = useState(() => todayLocal('23:59'));

  const [show, setShow] = useState<ShowFilter>('all');
  const [minParking, setMinParking] = useState(0);
  const [minMovement, setMinMovement] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('per-unit');

  const [reports, setReports] = useState<UnitReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedRange, setAppliedRange] = useState<{ from: string; to: string } | null>(null);

  // ---- auth bootstrap ----
  useEffect(() => {
    (async () => {
      captureTokenFromUrl();
      const cfg = await getConfig().catch(() => ({ host: '', requireAuth: true }));
      const token = getToken();
      if (token) {
        try {
          const { user } = await validateToken(token);
          setUser(user);
          setAuth('ready');
        } catch {
          setAuth('login');
        }
      } else if (cfg.requireAuth) {
        setAuth('login');
      } else {
        setAuth('ready'); // server has a fallback token
      }
    })();
  }, []);

  // ---- load objects once authenticated ----
  useEffect(() => {
    if (auth !== 'ready') return;
    Promise.all([fetchUnits(), fetchGroups()])
      .then(([u, g]) => {
        setUnits(u);
        setGroups(g);
        if (u.length) setSelected((s) => (s.length ? s : [u[0].id]));
      })
      .catch(onError);
  }, [auth]);

  function onError(e: any) {
    if (e instanceof AuthError || e?.code === 'AUTH') {
      setAuth('login');
      return;
    }
    setError(String(e.message || e));
  }

  const params: ReportParams = useMemo(
    () => ({
      unitIds: selected,
      from: toEpoch(from),
      to: toEpoch(to),
      show,
      minParking,
      minMovement,
    }),
    [selected, from, to, show, minParking, minMovement],
  );

  async function apply() {
    if (!selected.length) {
      setError('Выберите хотя бы один объект');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setReports(await runReport(params));
      setAppliedRange({ from, to });
    } catch (e: any) {
      onError(e);
    } finally {
      setLoading(false);
    }
  }

  async function doExport() {
    try {
      await exportXlsx(params, viewMode);
    } catch (e: any) {
      onError(e);
    }
  }

  if (auth === 'checking') {
    return <div className="login-screen"><div className="hint">Проверка авторизации…</div></div>;
  }
  if (auth === 'login') {
    return <Login error={error} />;
  }

  return (
    <div className="app">
      <Toolbar
        from={from}
        to={to}
        onFrom={setFrom}
        onTo={setTo}
        onApply={apply}
        loading={loading}
        user={user}
        onLogout={logout}
      />
      <div className="body">
        <Sidebar
          units={units}
          groups={groups}
          selected={selected}
          onSelected={setSelected}
          show={show}
          onShow={setShow}
          minParking={minParking}
          onMinParking={setMinParking}
          minMovement={minMovement}
          onMinMovement={setMinMovement}
          viewMode={viewMode}
          onViewMode={setViewMode}
        />
        <ReportView
          reports={reports}
          viewMode={viewMode}
          loading={loading}
          error={error}
          range={appliedRange}
          onExport={doExport}
        />
      </div>
    </div>
  );
}
