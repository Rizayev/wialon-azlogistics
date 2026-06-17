import type { ShowFilter, ViewMode } from '../types';

interface Props {
  show: ShowFilter;
  onShow: (s: ShowFilter) => void;
  minParking: number;
  onMinParking: (n: number) => void;
  minMovement: number;
  onMinMovement: (n: number) => void;
  viewMode: ViewMode;
  onViewMode: (v: ViewMode) => void;
}

const SHOW_OPTS: { value: ShowFilter; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'move', label: 'В движении' },
  { value: 'park', label: 'Парковка' },
  { value: 'park_in_geo', label: 'Стоянки в геозонах' },
  { value: 'park_out_geo', label: 'Стоянки вне геозон' },
];

export function ReportSettings(props: Props) {
  return (
    <div className="settings">
      <div className="report-type">Движение/стоянки (Xronologiya-Yeni)</div>
      <div className="settings-title">Настройки отчёта</div>

      <label className="field-label">Показывать</label>
      <select
        value={props.show}
        onChange={(e) => props.onShow(e.target.value as ShowFilter)}
      >
        {SHOW_OPTS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <label className="field-label">Мин. парковка</label>
      <div className="min-input">
        <input
          type="number"
          min={0}
          value={props.minParking}
          onChange={(e) => props.onMinParking(Number(e.target.value))}
        />
        <span>мин</span>
      </div>

      <label className="field-label">Мин. движение</label>
      <div className="min-input">
        <input
          type="number"
          min={0}
          value={props.minMovement}
          onChange={(e) => props.onMinMovement(Number(e.target.value))}
        />
        <span>мин</span>
      </div>

      <label className="field-label">Вид</label>
      <div className="viewmode">
        <button
          className={props.viewMode === 'per-unit' ? 'vm active' : 'vm'}
          onClick={() => props.onViewMode('per-unit')}
        >
          Таблица на юнит
        </button>
        <button
          className={props.viewMode === 'combined' ? 'vm active' : 'vm'}
          onClick={() => props.onViewMode('combined')}
        >
          Одна общая
        </button>
      </div>
    </div>
  );
}
