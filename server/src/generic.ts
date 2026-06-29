// Generic runner for any avl_unit_group report template (non-merged).
// Runs the template per unit, returns each table's header + rows as-is
// (Wialon-native), dropping the redundant per-unit "Grouping" column.

import {
  cleanupResult,
  execReport,
  getResultRows,
  getResultSubrows,
  setLocale,
} from './wialonClient';
import { RESOURCE_ID, getUnits } from './report';
import type { GenericCell, GenericTable, GenericUnitReport, WialonCell, WialonRow } from './types';

const GROUPING = new Set(['grouping', 'группировка', 'qruplaşdırma', 'qruplasdirma']);

function toCell(c: WialonCell): GenericCell {
  if (c == null) return { text: '' };
  if (typeof c === 'object') {
    const cell: GenericCell = { text: c.t ?? '' };
    if (typeof c.x === 'number' && typeof c.y === 'number') {
      cell.x = c.x;
      cell.y = c.y;
    }
    return cell;
  }
  return { text: String(c) };
}

async function runUnit(
  templateId: number,
  unitId: number,
  from: number,
  to: number,
): Promise<GenericTable[]> {
  const tables = await execReport(RESOURCE_ID, templateId, unitId, from, to);
  const out: GenericTable[] = [];

  for (let ti = 0; ti < tables.length; ti++) {
    const tbl = tables[ti];
    const header = tbl.header || [];
    // Skip statistics / empty tables (just № + Grouping or nothing).
    if (header.length <= 2) continue;

    const dropIdx = header.findIndex((h) => GROUPING.has(h.trim().toLowerCase()));
    const keep = (i: number) => i !== dropIdx;
    const outHeader = header.filter((_, i) => keep(i));

    const rowsOut: GenericCell[][] = [];
    const top = await getResultRows(ti, 0, Math.max(1, tbl.rows));
    for (let ri = 0; ri < top.length; ri++) {
      // `n` is unreliable (often 0 even when detail subrows exist), so always probe.
      const subs = await getResultSubrows(ti, ri);
      const emit: WialonRow[] = subs.length ? subs : [top[ri]];
      for (const e of emit) {
        rowsOut.push((e.c || []).filter((_, i) => keep(i)).map(toCell));
      }
    }
    out.push({ name: tbl.name, label: tbl.label, header: outHeader, rows: rowsOut });
  }

  await cleanupResult();
  return out;
}

export async function runGeneric(
  templateId: number,
  unitIds: number[],
  from: number,
  to: number,
  lang: string,
): Promise<GenericUnitReport[]> {
  await setLocale(lang);
  const units = await getUnits();
  const out: GenericUnitReport[] = [];
  for (const id of unitIds) {
    const unitId = Number(id);
    const tables = await runUnit(templateId, unitId, from, to);
    out.push({
      unitId,
      unitName: units.find((u) => u.id === unitId)?.nm || String(unitId),
      tables,
    });
  }
  return out;
}
