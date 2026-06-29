import type { LocRef, MergedRow, UnitReport } from '../types';
import { useLang } from '../LangContext';

function MapLoc({ loc, fallback }: { loc?: LocRef; fallback: string }) {
  if (!loc) return null;
  if (loc.x != null && loc.y != null) {
    return (
      <a
        className="loc-link"
        href={`https://maps.google.com/?q=${loc.y},${loc.x}`}
        target="_blank"
        rel="noreferrer"
        title={loc.t}
      >
        {loc.t || fallback}
      </a>
    );
  }
  return <span title={loc.t}>{loc.t}</span>;
}

export function UnitReportTable({ report }: { report: UnitReport }) {
  const { t, fmtDur } = useLang();
  const COLS = [
    t('col.status'), t('col.driver'), t('col.start'), t('col.end'), t('col.duration'),
    t('col.mileage'), t('col.avgSpeed'), t('col.maxSpeed'), t('col.fuel'),
  ];
  const km = t('units.km');
  const kmh = t('units.kmh');
  const lt = t('units.lt');

  function Row({ r }: { r: MergedRow }) {
    if (r.status === 'move') {
      return (
        <tr className="r-move">
          <td>{t('row.move')}</td>
          <td />
          <td>{r.start.t}</td>
          <td>{r.end.t}</td>
          <td>{fmtDur(r.durationSec)}</td>
          <td className="num">{r.mileageKm != null ? `${r.mileageKm} ${km}` : ''}</td>
          <td className="num">{r.avgSpeedKmh != null ? `${r.avgSpeedKmh} ${kmh}` : ''}</td>
          <td className="num">{r.maxSpeedKmh != null ? `${r.maxSpeedKmh} ${kmh}` : ''}</td>
          <td className="num">{r.fuelLiters != null ? `${r.fuelLiters.toFixed(2)} ${lt}` : ''}</td>
        </tr>
      );
    }
    return (
      <tr className="r-park">
        <td>{t('row.park')}</td>
        <td />
        <td>{r.start.t}</td>
        <td>{r.end.t}</td>
        <td>{fmtDur(r.durationSec)}</td>
        <td className="loc-cell" colSpan={4}>
          <MapLoc loc={r.location} fallback={t('map.show')} />
        </td>
      </tr>
    );
  }

  const m = report.totals.movement;
  const p = report.totals.parking;
  return (
    <div className="unit-report">
      <div className="unit-title">{report.unitName}</div>
      <table className="chrono">
        <thead>
          <tr>
            {COLS.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {report.rows.map((r, i) => (
            <Row key={i} r={r} />
          ))}
          {!report.rows.length && (
            <tr>
              <td colSpan={COLS.length} className="empty">
                {t('table.noData')}
              </td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr className="total">
            <td>{t('total.movement')}</td>
            <td>{m.count}</td>
            <td />
            <td />
            <td>{fmtDur(m.durationSec)}</td>
            <td className="num">{m.mileageKm} {km}</td>
            <td className="num">{m.avgSpeedKmh} {kmh}</td>
            <td className="num">{m.maxSpeedKmh} {kmh}</td>
            <td className="num">{m.fuelLiters.toFixed(2)} {lt}</td>
          </tr>
          <tr className="total">
            <td>{t('total.parking')}</td>
            <td>{p.count}</td>
            <td />
            <td />
            <td>{fmtDur(p.durationSec)}</td>
            <td colSpan={4} className="loc-cell">
              {t('total.allAddresses')}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
