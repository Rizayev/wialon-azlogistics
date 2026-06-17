// Pure transforms: turn raw Wialon Trips/Parkings subrows into a single
// time-sorted chronology, apply filters, and compute totals.

import type {
  LocRef,
  MergedRow,
  ReportRequest,
  TimeRef,
  UnitReport,
  WialonCell,
  WialonRow,
} from './types';

// ---- cell readers -----------------------------------------------------------

export function cellText(c: WialonCell): string {
  if (c == null) return '';
  if (typeof c === 'object') return c.t ?? '';
  return String(c);
}

export function cellTime(c: WialonCell): TimeRef {
  if (c && typeof c === 'object') return { t: c.t ?? '', v: c.v ?? 0 };
  return { t: String(c ?? ''), v: 0 };
}

export function cellLoc(c: WialonCell): LocRef {
  if (c && typeof c === 'object') return { t: c.t ?? '', x: c.x, y: c.y };
  return { t: String(c ?? '') };
}

/** Parse "195.57 km" / "36 km/h" / "0.65 l" -> number (NaN-safe -> 0). */
export function parseNum(s: string): number {
  const m = String(s).replace(',', '.').match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : 0;
}

/** Parse "5:21:58" or "1:48:47" or "0:01:50" -> seconds. */
export function parseHms(s: string): number {
  const parts = String(s).trim().split(':').map((p) => parseInt(p, 10));
  if (parts.some(Number.isNaN)) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}

/** Seconds -> "X ч Y мин" / "Y мин Z сек" / "Z сек" (Russian, matches Wialon UI). */
export function formatDuration(sec: number): string {
  sec = Math.max(0, Math.round(sec));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return m > 0 ? `${h} ч ${m} мин` : `${h} ч`;
  if (m > 0) return s > 0 ? `${m} мин ${s} сек` : `${m} мин`;
  return `${s} сек`;
}

/** Heuristic: a geocoded street address vs a named geofence. */
function looksLikeAddress(text: string): boolean {
  return /km from|Azerbaijan|küç\.|street|улиц/i.test(text);
}

// ---- column lookup ----------------------------------------------------------

function indexer(header: string[]): (label: string) => number {
  const map = new Map<string, number>();
  header.forEach((h, i) => map.set(h.trim().toLowerCase(), i));
  return (label: string) => map.get(label.trim().toLowerCase()) ?? -1;
}

// ---- row mappers ------------------------------------------------------------

export function mapTripRow(c: WialonCell[], header: string[]): MergedRow {
  const idx = indexer(header);
  const start = cellTime(c[idx('Beginning')]);
  const end = cellTime(c[idx('End')]);
  const durStr = cellText(c[idx('Duration')]);
  const durationSec = parseHms(durStr) || Math.max(0, end.v - start.v);
  return {
    status: 'move',
    start,
    end,
    durationSec,
    duration: formatDuration(durationSec),
    mileageKm: parseNum(cellText(c[idx('Mileage')])),
    avgSpeed: cellText(c[idx('Avg. speed')]),
    maxSpeed: cellText(c[idx('Max. speed')]),
    fuel: cellText(c[idx('Fuel consumed')]),
    locStart: cellLoc(c[idx('Initial location')]),
    locEnd: cellLoc(c[idx('Final location')]),
  };
}

export function mapParkRow(c: WialonCell[], header: string[]): MergedRow {
  const idx = indexer(header);
  const start = cellTime(c[idx('Beginning')]);
  const end = cellTime(c[idx('End')]);
  const durStr = cellText(c[idx('Duration')]);
  const durationSec = parseHms(durStr) || Math.max(0, end.v - start.v);
  const location = cellLoc(c[idx('Location')]);
  return {
    status: 'park',
    start,
    end,
    durationSec,
    duration: formatDuration(durationSec),
    location,
    inGeofence: location.t ? !looksLikeAddress(location.t) : false,
  };
}

// ---- merge + filter + totals -----------------------------------------------

export function mergeRows(
  tripRows: WialonRow[],
  tripHeader: string[],
  parkRows: WialonRow[],
  parkHeader: string[],
  req: Pick<ReportRequest, 'show' | 'minParking' | 'minMovement'>,
): MergedRow[] {
  const merged: MergedRow[] = [
    ...tripRows.map((r) => mapTripRow(r.c, tripHeader)),
    ...parkRows.map((r) => mapParkRow(r.c, parkHeader)),
  ];

  const minPark = (req.minParking || 0) * 60;
  const minMove = (req.minMovement || 0) * 60;

  const filtered = merged.filter((row) => {
    if (row.status === 'move' && row.durationSec < minMove) return false;
    if (row.status === 'park' && row.durationSec < minPark) return false;
    switch (req.show) {
      case 'move':
        return row.status === 'move';
      case 'park':
        return row.status === 'park';
      case 'park_in_geo':
        return row.status === 'park' && !!row.inGeofence;
      case 'park_out_geo':
        return row.status === 'park' && !row.inGeofence;
      default:
        return true;
    }
  });

  filtered.sort((a, b) => a.start.v - b.start.v);
  return filtered;
}

export function computeTotals(rows: MergedRow[]): UnitReport['totals'] {
  const moves = rows.filter((r) => r.status === 'move');
  const parks = rows.filter((r) => r.status === 'park');

  const moveSec = moves.reduce((s, r) => s + r.durationSec, 0);
  const mileage = moves.reduce((s, r) => s + (r.mileageKm || 0), 0);
  const fuel = moves.reduce((s, r) => s + parseNum(r.fuel || ''), 0);
  const maxSpeed = moves.reduce((m, r) => Math.max(m, parseNum(r.maxSpeed || '')), 0);
  const avgSpeed = moveSec > 0 ? Math.round(mileage / (moveSec / 3600)) : 0;
  const fuelUnit = (moves.find((r) => /[a-zA-Zа-яА-Я]/.test(r.fuel || ''))?.fuel || '').replace(/[\d.,\s]/g, '') || 'l';

  const parkSec = parks.reduce((s, r) => s + r.durationSec, 0);

  return {
    movement: {
      count: moves.length,
      durationSec: moveSec,
      duration: formatDuration(moveSec),
      mileageKm: Math.round(mileage * 100) / 100,
      avgSpeed: `${avgSpeed} км/ч`,
      maxSpeed: `${Math.round(maxSpeed)} км/ч`,
      fuel: `${(Math.round(fuel * 100) / 100).toFixed(2)} ${fuelUnit}`,
    },
    parking: {
      count: parks.length,
      durationSec: parkSec,
      duration: formatDuration(parkSec),
    },
  };
}
