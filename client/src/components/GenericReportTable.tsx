import type { GenericCell, GenericUnitReport } from '../types';
import { useLang } from '../LangContext';

function Cell({ c }: { c: GenericCell }) {
  if (c.x != null && c.y != null && c.text) {
    return (
      <a
        className="loc-link"
        href={`https://maps.google.com/?q=${c.y},${c.x}`}
        target="_blank"
        rel="noreferrer"
        title={c.text}
      >
        {c.text}
      </a>
    );
  }
  return <>{c.text}</>;
}

export function GenericReportTable({ report }: { report: GenericUnitReport }) {
  const { t } = useLang();
  return (
    <div className="unit-report">
      <div className="unit-title">{report.unitName}</div>
      {report.tables.length === 0 && <div className="hint">{t('table.noData')}</div>}
      {report.tables.map((tbl, ti) => (
        <div key={ti} className="gtable">
          <div className="gtable-label">{tbl.label}</div>
          <table className="chrono">
            <thead>
              <tr>
                {tbl.header.map((h, i) => (
                  <th key={i}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tbl.rows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((c, ci) => (
                    <td key={ci} className={c.x != null ? 'loc-cell' : undefined}>
                      <Cell c={c} />
                    </td>
                  ))}
                </tr>
              ))}
              {!tbl.rows.length && (
                <tr>
                  <td colSpan={tbl.header.length} className="empty">
                    {t('table.noData')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
