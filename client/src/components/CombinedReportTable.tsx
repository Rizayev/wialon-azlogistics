import type { LocRef, UnitReport } from '../types';
import { useLang } from '../LangContext';

function loc(l?: LocRef): string {
  return l?.t || '';
}

export function CombinedReportTable({ reports }: { reports: UnitReport[] }) {
  const { t, fmtDur } = useLang();
  const km = t('units.km');
  const kmh = t('units.kmh');
  const lt = t('units.lt');
  const COLS = [
    t('col.object'), t('col.status'), t('col.start'), t('col.end'), t('col.duration'),
    t('col.mileage'), t('col.avgSpeed'), t('col.maxSpeed'), t('col.fuel'),
  ];

  const rows = reports.flatMap((rep) => rep.rows.map((r) => ({ unit: rep.unitName, r })));

  let mCount = 0;
  let pCount = 0;
  let mileage = 0;
  let fuel = 0;
  let maxSpeed = 0;
  let mSec = 0;
  let pSec = 0;
  for (const rep of reports) {
    mCount += rep.totals.movement.count;
    pCount += rep.totals.parking.count;
    mileage += rep.totals.movement.mileageKm;
    fuel += rep.totals.movement.fuelLiters;
    maxSpeed = Math.max(maxSpeed, rep.totals.movement.maxSpeedKmh);
  }
  for (const { r } of rows) {
    if (r.status === 'move') mSec += r.durationSec;
    else pSec += r.durationSec;
  }

  return (
    <div className="unit-report">
      <div className="unit-title">{t('combined.title', { n: reports.length })}</div>
      <table className="chrono">
        <thead>
          <tr>
            {COLS.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ unit, r }, i) => (
            <tr key={i} className={r.status === 'move' ? 'r-move' : 'r-park'}>
              <td className="unit-col">{unit}</td>
              <td>{r.status === 'move' ? t('row.move') : t('row.park')}</td>
              <td>{r.start.t}</td>
              <td>{r.end.t}</td>
              <td>{fmtDur(r.durationSec)}</td>
              {r.status === 'move' ? (
                <>
                  <td className="num">{r.mileageKm != null ? `${r.mileageKm} ${km}` : ''}</td>
                  <td className="num">{r.avgSpeedKmh != null ? `${r.avgSpeedKmh} ${kmh}` : ''}</td>
                  <td className="num">{r.maxSpeedKmh != null ? `${r.maxSpeedKmh} ${kmh}` : ''}</td>
                  <td className="num">{r.fuelLiters != null ? `${r.fuelLiters.toFixed(2)} ${lt}` : ''}</td>
                </>
              ) : (
                <td className="loc-cell" colSpan={4}>
                  {loc(r.location)}
                </td>
              )}
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td colSpan={COLS.length} className="empty">
                {t('table.noData')}
              </td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr className="total">
            <td />
            <td>{t('total.movement')}</td>
            <td />
            <td />
            <td>{fmtDur(mSec)}</td>
            <td className="num">{Math.round(mileage * 100) / 100} {km}</td>
            <td className="num">{mSec > 0 ? Math.round(mileage / (mSec / 3600)) : 0} {kmh}</td>
            <td className="num">{Math.round(maxSpeed)} {kmh}</td>
            <td className="num">{fuel.toFixed(2)} {lt}</td>
          </tr>
          <tr className="total">
            <td />
            <td>{t('total.parking')}</td>
            <td />
            <td />
            <td>{fmtDur(pSec)}</td>
            <td colSpan={4} className="loc-cell">
              {t('combined.summary', { trips: mCount, parks: pCount })}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
