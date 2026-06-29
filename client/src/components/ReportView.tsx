import type { UnitReport, ViewMode } from '../types';
import { useLang } from '../LangContext';
import { UnitReportTable } from './UnitReportTable';
import { CombinedReportTable } from './CombinedReportTable';

interface Props {
  reports: UnitReport[];
  viewMode: ViewMode;
  loading: boolean;
  error: string | null;
  range: { from: string; to: string } | null;
  onExport: () => void;
}

function fmt(local: string): string {
  const [d, t] = local.split('T');
  const [y, mo, da] = d.split('-');
  return `${da}.${mo}.${y} ${t}`;
}

export function ReportView({ reports, viewMode, loading, error, range, onExport }: Props) {
  const { t } = useLang();
  return (
    <main className="report">
      {range && (
        <div className="period-banner">
          {t('report.period', { from: fmt(range.from), to: fmt(range.to) })}
        </div>
      )}

      {error && <div className="error-box">{t('report.error')}: {error}</div>}
      {loading && <div className="hint">{t('report.building')}</div>}

      {!loading && !reports.length && !error && <div className="hint">{t('report.empty')}</div>}

      {!loading && reports.length > 0 && (
        <div className="report-tables">
          {viewMode === 'combined' ? (
            <CombinedReportTable reports={reports} />
          ) : (
            reports.map((r) => <UnitReportTable key={r.unitId} report={r} />)
          )}
        </div>
      )}

      {reports.length > 0 && (
        <div className="export-bar no-print">
          <button onClick={onExport} title="Excel">
            ⬇ {t('export.excel')}
          </button>
          <button onClick={() => window.print()} title="PDF">
            🖨 {t('export.pdf')}
          </button>
          <button onClick={() => window.print()} title={t('export.print')}>
            🖨 {t('export.print')}
          </button>
        </div>
      )}
    </main>
  );
}
