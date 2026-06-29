// Build an .xlsx workbook from merged unit reports, localized to AZ/RU/EN.

import ExcelJS from 'exceljs';
import type { MergedRow, UnitReport } from './types';

export type Lang = 'az' | 'ru' | 'en';

interface Dict {
  cols: string[];
  object: string;
  move: string;
  park: string;
  totalMove: string;
  totalPark: string;
  allAddr: string;
  km: string;
  kmh: string;
  lt: string;
  h: string;
  min: string;
  sec: string;
  combined: string;
}

const DICT: Record<Lang, Dict> = {
  az: {
    cols: ['Status', 'Sürücü', 'Başlanğıc', 'Son', 'Müddət', 'Yürüş', 'Orta sürət', 'Maks. sürət', 'Yanacaq sərfi'],
    object: 'Obyekt', move: 'Hərəkətdə', park: 'Dayanma',
    totalMove: 'Cəmi hərəkət', totalPark: 'Cəmi dayanma', allAddr: 'Bütün ünvanlar',
    km: 'km', kmh: 'km/saat', lt: 'lt', h: 'saat', min: 'dəq', sec: 'san', combined: 'Yekun hesabat',
  },
  ru: {
    cols: ['Статус', 'Водитель', 'Старт', 'Конец', 'Длительность', 'Пробег', 'Сред. скорость', 'Макс. скорость', 'Расход топлива'],
    object: 'Объект', move: 'В движении', park: 'Парковка',
    totalMove: 'Итого движение', totalPark: 'Итого стоянка', allAddr: 'Все адреса',
    km: 'км', kmh: 'км/ч', lt: 'л', h: 'ч', min: 'мин', sec: 'сек', combined: 'Сводный отчёт',
  },
  en: {
    cols: ['Status', 'Driver', 'Start', 'End', 'Duration', 'Mileage', 'Avg. speed', 'Max. speed', 'Fuel consumed'],
    object: 'Object', move: 'Moving', park: 'Parking',
    totalMove: 'Total moving', totalPark: 'Total parking', allAddr: 'All addresses',
    km: 'km', kmh: 'km/h', lt: 'L', h: 'h', min: 'min', sec: 'sec', combined: 'Combined report',
  },
};

function fmtDur(sec: number, d: Dict): string {
  sec = Math.max(0, Math.round(sec));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return m > 0 ? `${h} ${d.h} ${m} ${d.min}` : `${h} ${d.h}`;
  if (m > 0) return s > 0 ? `${m} ${d.min} ${s} ${d.sec}` : `${m} ${d.min}`;
  return `${s} ${d.sec}`;
}

function rowValues(r: MergedRow, d: Dict): (string | number)[] {
  if (r.status === 'move') {
    return [
      d.move, '', r.start.t, r.end.t, fmtDur(r.durationSec, d),
      r.mileageKm != null ? `${r.mileageKm} ${d.km}` : '',
      r.avgSpeedKmh != null ? `${r.avgSpeedKmh} ${d.kmh}` : '',
      r.maxSpeedKmh != null ? `${r.maxSpeedKmh} ${d.kmh}` : '',
      r.fuelLiters != null ? `${r.fuelLiters.toFixed(2)} ${d.lt}` : '',
    ];
  }
  return [d.park, '', r.start.t, r.end.t, fmtDur(r.durationSec, d), '', r.location?.t || '', '', ''];
}

function fillSheet(ws: ExcelJS.Worksheet, rep: UnitReport, withObject: boolean, d: Dict) {
  const header = withObject ? [d.object, ...d.cols] : d.cols;
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
    const vals = rowValues(r, d);
    ws.addRow(withObject ? [rep.unitName, ...vals] : vals);
  }

  const m = rep.totals.movement;
  const p = rep.totals.parking;
  const pad = withObject ? [''] : [];
  ws.addRow([
    ...pad, d.totalMove, String(m.count), '', '', fmtDur(m.durationSec, d),
    `${m.mileageKm} ${d.km}`, `${m.avgSpeedKmh} ${d.kmh}`, `${m.maxSpeedKmh} ${d.kmh}`,
    `${m.fuelLiters.toFixed(2)} ${d.lt}`,
  ]).font = { bold: true };
  ws.addRow([...pad, d.totalPark, String(p.count), '', '', fmtDur(p.durationSec, d), d.allAddr, '', '', '']).font = {
    bold: true,
  };

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
  lang: Lang = 'ru',
): Promise<Buffer> {
  const d = DICT[lang] || DICT.ru;
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Wialon AZLogistika';

  if (combined) {
    const ws = wb.addWorksheet(d.combined);
    reports.forEach((rep, i) => {
      fillSheet(ws, rep, true, d);
      if (i < reports.length - 1) ws.addRow([]);
    });
  } else {
    reports.forEach((rep, i) => {
      const safe = rep.unitName.replace(/[\\/?*[\]:]/g, ' ').slice(0, 28) || `Unit ${i + 1}`;
      fillSheet(wb.addWorksheet(safe), rep, false, d);
    });
  }

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
