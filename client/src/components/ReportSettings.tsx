import type { ShowFilter, ViewMode } from '../types';
import { useLang } from '../LangContext';

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

const SHOW_OPTS: { value: ShowFilter; key: string }[] = [
  { value: 'all', key: 'show.all' },
  { value: 'move', key: 'show.move' },
  { value: 'park', key: 'show.park' },
  { value: 'park_in_geo', key: 'show.parkInGeo' },
  { value: 'park_out_geo', key: 'show.parkOutGeo' },
];

export function ReportSettings(props: Props) {
  const { t } = useLang();
  return (
    <div className="settings">
      <div className="report-type">{t('settings.reportType')}</div>
      <div className="settings-title">{t('settings.title')}</div>

      <label className="field-label">{t('settings.show')}</label>
      <select value={props.show} onChange={(e) => props.onShow(e.target.value as ShowFilter)}>
        {SHOW_OPTS.map((o) => (
          <option key={o.value} value={o.value}>
            {t(o.key)}
          </option>
        ))}
      </select>

      <label className="field-label">{t('settings.minParking')}</label>
      <div className="min-input">
        <input
          type="number"
          min={0}
          value={props.minParking}
          onChange={(e) => props.onMinParking(Number(e.target.value))}
        />
        <span>{t('unit.min')}</span>
      </div>

      <label className="field-label">{t('settings.minMovement')}</label>
      <div className="min-input">
        <input
          type="number"
          min={0}
          value={props.minMovement}
          onChange={(e) => props.onMinMovement(Number(e.target.value))}
        />
        <span>{t('unit.min')}</span>
      </div>

      <label className="field-label">{t('settings.view')}</label>
      <div className="viewmode">
        <button
          className={props.viewMode === 'per-unit' ? 'vm active' : 'vm'}
          onClick={() => props.onViewMode('per-unit')}
        >
          {t('view.perUnit')}
        </button>
        <button
          className={props.viewMode === 'combined' ? 'vm active' : 'vm'}
          onClick={() => props.onViewMode('combined')}
        >
          {t('view.combined')}
        </button>
      </div>
    </div>
  );
}
