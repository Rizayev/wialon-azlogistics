import { redirectToLogin } from '../auth';
import { useLang } from '../LangContext';
import { LANGS, type Lang } from '../i18n';

export function Login({ error }: { error?: string | null }) {
  const { t, lang, setLang } = useLang();
  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-langs">
          {LANGS.map((l) => (
            <button
              key={l.code}
              className={l.code === lang ? 'lang-pill active' : 'lang-pill'}
              onClick={() => setLang(l.code as Lang)}
            >
              {l.label}
            </button>
          ))}
        </div>
        <div className="login-logo">Wialon · AZLogistika</div>
        <p className="login-sub">{t('login.subtitle')}</p>
        {error && <div className="error-box">{error}</div>}
        <button className="login-btn" onClick={() => redirectToLogin()}>
          {t('login.button')}
        </button>
        <p className="login-hint">{t('login.hint')}</p>
      </div>
    </div>
  );
}
