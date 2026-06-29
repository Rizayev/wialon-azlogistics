import { useLang } from '../LangContext';
import { LANGS, type Lang } from '../i18n';

interface Props {
  from: string;
  to: string;
  onFrom: (v: string) => void;
  onTo: (v: string) => void;
  onApply: () => void;
  loading: boolean;
  user?: string;
  onLogout: () => void;
}

export function Toolbar({ from, to, onFrom, onTo, onApply, loading, user, onLogout }: Props) {
  const { t, lang, setLang } = useLang();
  return (
    <div className="toolbar">
      <div className="tabs">
        <button className="tab active">{t('nav.reports')}</button>
        <button className="tab" disabled>
          {t('nav.trends')}
        </button>
      </div>
      <div className="toolbar-right">
        <select
          className="lang-select"
          value={lang}
          onChange={(e) => setLang(e.target.value as Lang)}
          title="Language"
        >
          {LANGS.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
        <div className="daterange">
          <input type="datetime-local" value={from} onChange={(e) => onFrom(e.target.value)} />
          <span className="dash">—</span>
          <input type="datetime-local" value={to} onChange={(e) => onTo(e.target.value)} />
        </div>
        <button className="apply-btn" onClick={onApply} disabled={loading}>
          {loading ? t('btn.loading') : t('btn.apply')}
        </button>
        {user && (
          <div className="user-box">
            <span className="user-name" title={user}>
              {user}
            </span>
            <button className="logout-btn" onClick={onLogout} title={t('btn.logout')}>
              {t('btn.logout')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
