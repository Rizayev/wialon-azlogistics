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
  return (
    <div className="toolbar">
      <div className="tabs">
        <button className="tab active">Отчёты</button>
        <button className="tab" disabled>
          Тренды
        </button>
      </div>
      <div className="toolbar-right">
        <div className="daterange">
          <input
            type="datetime-local"
            value={from}
            onChange={(e) => onFrom(e.target.value)}
          />
          <span className="dash">—</span>
          <input
            type="datetime-local"
            value={to}
            onChange={(e) => onTo(e.target.value)}
          />
        </div>
        <button className="apply-btn" onClick={onApply} disabled={loading}>
          {loading ? 'Загрузка…' : 'Применить'}
        </button>
        {user && (
          <div className="user-box">
            <span className="user-name" title={user}>
              {user}
            </span>
            <button className="logout-btn" onClick={onLogout} title="Выйти">
              Выход
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
