import type { MaturityApplication, MaturityPillarDefinition, MaturityPillarValue } from '../../../types/maturity-matrix.types';

export const DEFAULT_PILLARS: MaturityPillarDefinition[] = [
  { key: 'DATA', label: 'DATA', icon: '💾', rowOffset: 0 },
  { key: 'DELIVERY', label: 'DELIVERY', icon: '🚚', rowOffset: 7 },
  { key: 'DESIGN', label: 'DESIGN', icon: '🎨', rowOffset: 14 },
  { key: 'DEV', label: 'DEV', icon: '💻', rowOffset: 21 },
  { key: 'INFRA', label: 'INFRA', icon: '🏗️', rowOffset: 28 },
  { key: 'PROCESS_PRACTICES', label: 'PROCESS PRACTICES', icon: '⚙️', rowOffset: 42 },
  { key: 'QUALITY', label: 'QUALITY', icon: '🧪', rowOffset: 49 },
  { key: 'OPERATION', label: 'OPERATION', icon: '📊', rowOffset: 35 },
  { key: 'SECURITY', label: 'SECURITY', icon: '🛡️', rowOffset: 56 },
  { key: 'STREAMING', label: 'STREAMING', icon: '📡', rowOffset: 63 },
  { key: 'ACCESSIBILITY', label: 'ACCESSIBILITY', icon: '♿', rowOffset: 70 },
];

export const KNOWN_START_ROWS: Record<string, number> = {
  AVAILABLE_SHIPMENT: 78,
  APO: 2,
  BOM_MANAGER: 156,
  DPCP_FORCAST: 233,
  MOLD: 310,
  MPS_APO: 387,
  MRP_EXCHANGE: 464,
  ORDER_AMENDMENT_BACK: 541,
  ORDER_AMENDMENT_FRONT: 618,
  ORDER_DELIVERY_PARTNER: 695,
  ORDER_MANAGEMENT_PURCHASE_ORDER_API: 772,
  ORDERMAX: 849,
  PRODCOM: 926,
  PRODCOM_API: 1003,
  PSV: 1080,
  RFQ_AND_SHARING: 1157,
  SAVE_THE_STOCKS: 1234,
  SCAN_DELAY: 1311,
  SHU_SSCC: 1388,
  SMART_SUPPLY_BACK: 1465,
  SMART_SUPPLY_FRONT: 1542,
  SMDI: 1619,
};

export function getDiffScore(pillarVal?: MaturityPillarValue): number | null {
  if (!pillarVal) return null;
  if (pillarVal.diffScore !== undefined && pillarVal.diffScore !== null) {
    return pillarVal.diffScore;
  }
  if (pillarVal.prevDate && pillarVal.prevScore !== undefined) {
    return pillarVal.score - pillarVal.prevScore;
  }
  return null;
}

export function getDiffLevel(pillarVal?: MaturityPillarValue): number | null {
  if (!pillarVal) return null;
  if (pillarVal.diffLevel !== undefined && pillarVal.diffLevel !== null) {
    return pillarVal.diffLevel;
  }
  if (pillarVal.prevDate && pillarVal.level && pillarVal.prevLevel) {
    const currNum = parseInt(pillarVal.level.replace(/\D/g, ''), 10);
    const prevNum = parseInt(pillarVal.prevLevel.replace(/\D/g, ''), 10);
    if (!Number.isNaN(currNum) && !Number.isNaN(prevNum)) {
      return currNum - prevNum;
    }
  }
  return null;
}

export function getAppStartRow(app: MaturityApplication, index: number): number {
  if (app.startRow !== undefined) return app.startRow;
  if (KNOWN_START_ROWS[app.code]) return KNOWN_START_ROWS[app.code];
  return index * 75 + 2;
}

export function getAppRowIdx(app: MaturityApplication, index: number): number {
  if (app.rowIdx !== undefined) return app.rowIdx;
  return index + 2;
}

export function getDateHealth(dateStr: string | null | undefined) {
  if (!dateStr || dateStr === 'null') {
    return {
      status: 'yellow',
      label: 'Yellow: No assessment',
      badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
      dotColor: 'bg-amber-500',
      desc: 'No assessment',
    };
  }

  const parts = dateStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  const assessDate = new Date(year, month - 1, day);
  const TODAY_ANCHOR = new Date('2026-09-14T00:00:00Z');
  const diffMs = TODAY_ANCHOR.getTime() - assessDate.getTime();
  const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  const diffMonths = Math.floor(diffDays / 30.4);

  if (diffDays <= 15) {
    return {
      status: 'green',
      label: 'Green: ≤ 15 Days',
      badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      dotColor: 'bg-emerald-500',
      desc: `${diffDays}d ago (≤15d)`,
    };
  }

  if (diffDays <= 150) {
    return {
      status: 'blue',
      label: 'Blue: Valid',
      badgeBg: 'bg-blue-100 text-blue-900 border-blue-300',
      dotColor: 'bg-blue-500',
      desc: `Valid (${diffMonths}m ago)`,
    };
  }

  if (diffDays <= 182) {
    return {
      status: 'orange',
      label: 'Orange: todo if >5M',
      badgeBg: 'bg-orange-100 text-orange-900 border-orange-300',
      dotColor: 'bg-orange-500',
      desc: `Todo (${diffMonths}m ago)`,
    };
  }

  return {
    status: 'red',
    label: 'Red: Outdated >6M',
    badgeBg: 'bg-rose-100 text-rose-900 border-rose-300',
    dotColor: 'bg-rose-500',
    desc: `Outdated (${diffMonths}m ago)`,
  };
}

export function getAppMinMaxDates(pillars: Record<string, MaturityPillarValue>) {
  const validDates = Object.values(pillars)
    .map((p) => p.date)
    .filter((d): d is string => Boolean(d && d !== 'null'));

  if (validDates.length === 0) {
    return { minDate: null, maxDate: null };
  }

  validDates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  return {
    minDate: validDates[0],
    maxDate: validDates[validDates.length - 1],
  };
}
