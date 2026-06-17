import type { LocRef, UnitReport } from '../types';

const COLS = [
  'Объект',
  'Статус',
  'Старт',
  'Конец',
  'Длительность',
  'Пробег',
  'Сред. скорость',
  'Макс. скорость',
  'Расход топлива',
];

function loc(l?: LocRef): string {
  return l?.t || '';
}

export function CombinedReportTable({ reports }: { reports: UnitReport[] }) {
  // Flatten all units into one table; keep per-unit grouping by name then time.
  const rows = reports.flatMap((rep) =>
    rep.rows.map((r) => ({ unit: rep.unitName, r })),
  );

  // grand totals
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
    fuel += parseFloat(rep.totals.movement.fuel) || 0;
    maxSpeed = Math.max(maxSpeed, parseFloat(rep.totals.movement.maxSpeed) || 0);
  }
  for (const { r } of rows) {
    if (r.status === 'move') mSec += r.durationSec;
    else pSec += r.durationSec;
  }
  const fmtDur = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return h > 0 ? `${h} ч ${m} мин` : `${m} мин`;
  };

  return (
    <div className="unit-report">
      <div className="unit-title">Сводный отчёт — {reports.length} объект(ов)</div>
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
              <td>{r.status === 'move' ? 'В движении' : 'Парковка'}</td>
              <td>{r.start.t}</td>
              <td>{r.end.t}</td>
              <td>{r.duration}</td>
              {r.status === 'move' ? (
                <>
                  <td className="num">{r.mileageKm != null ? `${r.mileageKm} км` : ''}</td>
                  <td className="num">{r.avgSpeed}</td>
                  <td className="num">{r.maxSpeed}</td>
                  <td className="num">{r.fuel}</td>
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
                Нет данных за период
              </td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr className="total">
            <td />
            <td>Итого движение</td>
            <td />
            <td />
            <td>{fmtDur(mSec)}</td>
            <td className="num">{Math.round(mileage * 100) / 100} км</td>
            <td className="num">
              {mSec > 0 ? Math.round(mileage / (mSec / 3600)) : 0} км/ч
            </td>
            <td className="num">{Math.round(maxSpeed)} км/ч</td>
            <td className="num">{fuel.toFixed(2)} l</td>
          </tr>
          <tr className="total">
            <td />
            <td>Итого стоянка</td>
            <td />
            <td />
            <td>{fmtDur(pSec)}</td>
            <td colSpan={4} className="loc-cell">
              {mCount} поездок / {pCount} стоянок
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
