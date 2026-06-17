// Build an .xlsx workbook from merged unit reports (matches the on-screen table).

import ExcelJS from 'exceljs';
import type { MergedRow, UnitReport } from './types';

const HEADERS = [
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

function rowValues(r: MergedRow): (string | number)[] {
  if (r.status === 'move') {
    return [
      'В движении',
      '',
      r.start.t,
      r.end.t,
      r.duration,
      r.mileageKm != null ? `${r.mileageKm} км` : '',
      r.avgSpeed || '',
      r.maxSpeed || '',
      r.fuel || '',
    ];
  }
  return [
    'Парковка',
    '',
    r.start.t,
    r.end.t,
    r.duration,
    '',
    r.location?.t || '',
    '',
    '',
  ];
}

function fillSheet(ws: ExcelJS.Worksheet, rep: UnitReport, withObject: boolean) {
  const header = withObject ? ['Объект', ...HEADERS] : HEADERS;
  const titleRow = ws.addRow([rep.unitName]);
  titleRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  titleRow.eachCell((c) => {
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1C6FB5' } };
  });
  ws.mergeCells(titleRow.number, 1, titleRow.number, header.length);

  const hr = ws.addRow(header);
  hr.font = { bold: true };
  hr.eachCell((c) => {
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE9EDF1' } };
  });

  for (const r of rep.rows) {
    const vals = rowValues(r);
    ws.addRow(withObject ? [rep.unitName, ...vals] : vals);
  }

  const m = rep.totals.movement;
  const p = rep.totals.parking;
  const pad = withObject ? [''] : [];
  ws.addRow([
    ...pad,
    'Итого движение',
    String(m.count),
    '',
    '',
    m.duration,
    `${m.mileageKm} км`,
    m.avgSpeed,
    m.maxSpeed,
    m.fuel,
  ]).font = { bold: true };
  ws.addRow([
    ...pad,
    'Итого стоянка',
    String(p.count),
    '',
    '',
    p.duration,
    '',
    '',
    '',
    '',
  ]).font = { bold: true };

  ws.columns.forEach((col) => {
    let max = 10;
    col.eachCell?.({ includeEmpty: false }, (c) => {
      max = Math.max(max, String(c.value ?? '').length + 2);
    });
    col.width = Math.min(max, 48);
  });
}

export async function buildWorkbook(
  reports: UnitReport[],
  combined: boolean,
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Wialon AZLogistika';

  if (combined) {
    const ws = wb.addWorksheet('Отчёт');
    reports.forEach((rep, i) => {
      fillSheet(ws, rep, true);
      if (i < reports.length - 1) ws.addRow([]);
    });
  } else {
    reports.forEach((rep, i) => {
      const safe = rep.unitName.replace(/[\\/?*[\]:]/g, ' ').slice(0, 28) || `Unit ${i + 1}`;
      const ws = wb.addWorksheet(safe);
      fillSheet(ws, rep, false);
    });
  }

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
