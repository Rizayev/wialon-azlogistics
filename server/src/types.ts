// Shared backend types for the merged Wialon chronology report.

/** A Wialon report cell: either a plain string or a rich object. */
export type WialonCell =
  | string
  | number
  | null
  | {
      t?: string; // display text
      v?: number; // raw value (epoch seconds for time cells)
      x?: number; // longitude
      y?: number; // latitude
      u?: number; // unit id
    };

export interface WialonRow {
  c: WialonCell[];
  n?: number; // child-row count
}

export interface Unit {
  id: number;
  nm: string;
}

export interface Group {
  id: number;
  nm: string;
  units: number[];
}

export interface TimeRef {
  t: string; // formatted text, e.g. "16.06.2026 03:55:32"
  v: number; // epoch seconds
}

export interface LocRef {
  t: string; // address or geofence name
  x?: number;
  y?: number;
}

/** One merged chronology row — a movement segment or a parking.
 *  Numeric/raw values only; the client formats units + duration per language. */
export interface MergedRow {
  status: 'move' | 'park';
  start: TimeRef;
  end: TimeRef;
  durationSec: number;
  // movement-only
  mileageKm?: number;
  avgSpeedKmh?: number;
  maxSpeedKmh?: number;
  fuelLiters?: number;
  locStart?: LocRef;
  locEnd?: LocRef;
  // parking-only
  location?: LocRef;
  inGeofence?: boolean;
}

export interface MovementTotals {
  count: number;
  durationSec: number;
  mileageKm: number;
  avgSpeedKmh: number;
  maxSpeedKmh: number;
  fuelLiters: number;
}

export interface ParkingTotals {
  count: number;
  durationSec: number;
}

export interface UnitReport {
  unitId: number;
  unitName: string;
  rows: MergedRow[];
  totals: {
    movement: MovementTotals;
    parking: ParkingTotals;
  };
}

export type ShowFilter =
  | 'all'
  | 'move'
  | 'park'
  | 'park_in_geo'
  | 'park_out_geo';

export interface ReportRequest {
  unitIds: number[];
  from: number; // epoch seconds
  to: number; // epoch seconds
  show: ShowFilter;
  minParking: number; // minutes
  minMovement: number; // minutes
}
