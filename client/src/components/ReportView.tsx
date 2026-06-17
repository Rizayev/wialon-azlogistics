import type { UnitReport, ViewMode } from '../types';
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
  // "2026-06-17T00:00" -> "17.06.2026 00:00"
  const [d, t] = local.split('T');
  const [y, mo, da] = d.split('-');
  return `${da}.${mo}.${y} ${t}`;
}

export function ReportView({ reports, viewMode, loading, error, range, onExport }: Props) {
  return (
    <main className="report">
      {range && (
        <div className="period-banner">
          Движение/стоянки за период с {fmt(range.from)} по {fmt(range.to)}
        </div>
      )}

      {error && <div className="error-box">Ошибка: {error}</div>}
      {loading && <div className="hint">Формирование отчёта…</div>}

      {!loading && !reports.length && !error && (
        <div className="hint">
          Выберите объект(ы), задайте период и нажмите «Применить».
        </div>
      )}

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
          <button onClick={onExport} title="Экспорт в Excel">
            ⬇ Excel
          </button>
          <button onClick={() => window.print()} title="PDF (сохранить как PDF)">
            🖨 PDF
          </button>
          <button onClick={() => window.print()} title="Печать">
            🖨 Печать
          </button>
        </div>
      )}
    </main>
  );
}
