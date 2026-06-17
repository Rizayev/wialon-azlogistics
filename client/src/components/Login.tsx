import { redirectToLogin } from '../auth';

export function Login({ error }: { error?: string | null }) {
  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">Wialon · AZLogistika</div>
        <p className="login-sub">Объединённая хронология (Xronologiya-Yeni)</p>
        {error && <div className="error-box">{error}</div>}
        <button className="login-btn" onClick={() => redirectToLogin()}>
          Войти через Wialon
        </button>
        <p className="login-hint">
          Откроется страница авторизации go.gps.az. После входа вы вернётесь сюда,
          токен сохранится в браузере до истечения срока действия.
        </p>
      </div>
    </div>
  );
}
