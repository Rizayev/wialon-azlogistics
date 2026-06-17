import type { LocRef, MergedRow, UnitReport } from '../types';

const COLS = [
  'Статус',
  'Водитель',
  'Старт',
  'Конец',
  'Длительность',
  'Пробег',
  'Сред. скорость',
  'Макс. скорость',
  'Расход топлива',
];

function MapLoc({ loc }: { loc?: LocRef }) {
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
        {loc.t || 'Показать на карте'}
      </a>
    );
  }
  return <span title={loc.t}>{loc.t}</span>;
}

function Row({ r }: { r: MergedRow }) {
  if (r.status === 'move') {
    return (
      <tr className="r-move">
        <td>В движении</td>
        <td />
        <td>{r.start.t}</td>
        <td>{r.end.t}</td>
        <td>{r.duration}</td>
        <td className="num">{r.mileageKm != null ? `${r.mileageKm} км` : ''}</td>
        <td className="num">{r.avgSpeed}</td>
        <td className="num">{r.maxSpeed}</td>
        <td className="num">{r.fuel}</td>
      </tr>
    );
  }
  return (
    <tr className="r-park">
      <td>Парковка</td>
      <td />
      <td>{r.start.t}</td>
      <td>{r.end.t}</td>
      <td>{r.duration}</td>
      <td className="loc-cell" colSpan={4}>
        <MapLoc loc={r.location} />
      </td>
    </tr>
  );
}

export function UnitReportTable({ report }: { report: UnitReport }) {
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
                Нет данных за период
              </td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr className="total">
            <td>Итого движение</td>
            <td>{m.count}</td>
            <td />
            <td />
            <td>{m.duration}</td>
            <td className="num">{m.mileageKm} км</td>
            <td className="num">{m.avgSpeed}</td>
            <td className="num">{m.maxSpeed}</td>
            <td className="num">{m.fuel}</td>
          </tr>
          <tr className="total">
            <td>Итого стоянка</td>
            <td>{p.count}</td>
            <td />
            <td />
            <td>{p.duration}</td>
            <td colSpan={4} className="loc-cell">
              Все адреса
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
