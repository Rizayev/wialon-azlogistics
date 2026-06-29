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
  t: string;
  v: number;
}

export interface LocRef {
  t: string;
  x?: number;
  y?: number;
}

export interface MergedRow {
  status: 'move' | 'park';
  start: TimeRef;
  end: TimeRef;
  durationSec: number;
  mileageKm?: number;
  avgSpeedKmh?: number;
  maxSpeedKmh?: number;
  fuelLiters?: number;
  locStart?: LocRef;
  locEnd?: LocRef;
  location?: LocRef;
  inGeofence?: boolean;
}

export interface UnitReport {
  unitId: number;
  unitName: string;
  rows: MergedRow[];
  totals: {
    movement: {
      count: number;
      durationSec: number;
      mileageKm: number;
      avgSpeedKmh: number;
      maxSpeedKmh: number;
      fuelLiters: number;
    };
    parking: {
      count: number;
      durationSec: number;
    };
  };
}

export type ShowFilter =
  | 'all'
  | 'move'
  | 'park'
  | 'park_in_geo'
  | 'park_out_geo';

export type ViewMode = 'per-unit' | 'combined';

export interface ReportParams {
  unitIds: number[];
  from: number;
  to: number;
  show: ShowFilter;
  minParking: number;
  minMovement: number;
}
