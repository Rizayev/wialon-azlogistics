// Orchestrates: list units/groups, run the Xronologiya-Yeni template per unit,
// pull Trips + Parkings subrows, and return a merged UnitReport.

import {
  activeToken,
  cleanupResult,
  execReport,
  getResultSubrows,
  searchItems,
  setLocale,
} from './wialonClient';
import { computeTotals, mergeRows } from './merge';
import type { Group, ReportRequest, Unit, UnitReport } from './types';

export const RESOURCE_ID = Number(process.env.WIALON_RESOURCE_ID || 49131);
export const TEMPLATE_ID = Number(process.env.WIALON_TEMPLATE_ID || 16);
export const MERGED_TEMPLATE_ID = TEMPLATE_ID;

const FLAG_BASE = 1;
const FLAG_REPORTS = 8192;

export interface TemplateInfo {
  id: number;
  name: string;
  merged: boolean;
}

/** List report templates in the resource (id + name). */
export async function getTemplates(): Promise<TemplateInfo[]> {
  const items = await searchItems('avl_resource', FLAG_BASE | FLAG_REPORTS);
  const res = items.find((it: any) => it.id === RESOURCE_ID) || items[0];
  const rep = (res?.rep || {}) as Record<string, { n: string }>;
  return Object.entries(rep)
    .map(([id, v]) => ({ id: Number(id), name: v.n, merged: Number(id) === MERGED_TEMPLATE_ID }))
    .sort((a, b) => a.id - b.id);
}
// Units differ per token (per user), so cache by active token.
const unitCache = new Map<string, Unit[]>();

export async function getUnits(force = false): Promise<Unit[]> {
  const key = activeToken();
  const cached = unitCache.get(key);
  if (cached && !force) return cached;
  const items = await searchItems('avl_unit', FLAG_BASE);
  const units = items
    .map((it: any) => ({ id: it.id, nm: it.nm }))
    .sort((a: Unit, b: Unit) => a.nm.localeCompare(b.nm));
  unitCache.set(key, units);
  return units;
}

export async function getGroups(): Promise<Group[]> {
  const items = await searchItems('avl_unit_group', FLAG_BASE);
  return items.map((it: any) => ({ id: it.id, nm: it.nm, units: it.u || [] }));
}

async function unitName(id: number): Promise<string> {
  const units = await getUnits();
  return units.find((u) => u.id === id)?.nm || String(id);
}

/** Run the report for one unit and return the merged chronology. */
export async function buildUnitReport(
  unitId: number,
  req: ReportRequest,
): Promise<UnitReport> {
  // Merge mapping relies on English column labels; force en regardless of UI lang.
  await setLocale('en');
  const tables = await execReport(
    RESOURCE_ID,
    TEMPLATE_ID,
    unitId,
    req.from,
    req.to,
  );

  const tripIdx = tables.findIndex((t) => /trip/i.test(t.name));
  const parkIdx = tables.findIndex((t) => /stay|park/i.test(t.name));

  const tripTable = tripIdx >= 0 ? tables[tripIdx] : null;
  const parkTable = parkIdx >= 0 ? tables[parkIdx] : null;

  // Top row (index 0) is the unit grouping row; individual segments are its subrows.
  const tripRows =
    tripTable && tripTable.rows > 0 ? await getResultSubrows(tripIdx, 0) : [];
  const parkRows =
    parkTable && parkTable.rows > 0 ? await getResultSubrows(parkIdx, 0) : [];

  await cleanupResult();

  const rows = mergeRows(
    tripRows,
    tripTable?.header || [],
    parkRows,
    parkTable?.header || [],
    req,
  );

  return {
    unitId,
    unitName: await unitName(unitId),
    rows,
    totals: computeTotals(rows),
  };
}

/** Run the report for all requested units (sequentially — one shared session). */
export async function buildReport(req: ReportRequest): Promise<UnitReport[]> {
  const out: UnitReport[] = [];
  for (const id of req.unitIds) {
    out.push(await buildUnitReport(Number(id), req));
  }
  return out;
}
