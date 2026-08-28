import type { Candle, LaunchPhase, SortKey } from './types';

export const PHASE_ORDER: (LaunchPhase | null)[] = [null, 'P1', 'P2', 'P3'];

export const PHASE_LABELS: Record<LaunchPhase, string> = {
  P1: 'Phase 1 — approved for throw & smell',
  P2: 'Phase 2 — ready for second round of review/opinions',
  P3: 'Phase 3 — ready for market (eventually)',
};

export function nextPhase(current: LaunchPhase | null): LaunchPhase | null {
  const currentPos = PHASE_ORDER.indexOf(current ?? null);
  return PHASE_ORDER[(currentPos + 1) % PHASE_ORDER.length] ?? null;
}

export function statusClass(status: string | null | undefined): string {
  const s = (status || '').toLowerCase();
  if (s.includes('kill')) return 'status-kill';
  if (s.includes('fill')) return 'status-fill';
  if (s.includes('revisit')) return 'status-revisit';
  return 'status-pending';
}

export function secondaryClass(sec: string | null | undefined): string {
  const s = (sec || '').toLowerCase();
  if (s === 'dead') return 'sec-dead';
  if (s === 'check complete') return 'sec-complete';
  return '';
}

const LABEL_COLOR_MAP: [string, string][] = [
  ['pink', '#E8B4C0'],
  ['rose', '#D98A9C'],
  ['coral', '#E8916B'],
  ['peach', '#F0B48A'],
  ['burgundy', '#7A2530'],
  ['oxblood', '#5A1B23'],
  ['plum', '#7B4B6B'],
  ['violet', '#8E7AA8'],
  ['mauve', '#B79AA6'],
  ['lavender', '#B7A6D9'],
  ['navy', '#2C3E63'],
  ['blue', '#3E6B8A'],
  ['seafoam', '#A9CFC2'],
  ['sage', '#9CAF88'],
  ['green', '#6E8C5A'],
  ['moss', '#6B7C4E'],
  ['chartreuse', '#B8CC4F'],
  ['grass', '#7DA646'],
  ['vine', '#6E8C42'],
  ['amber', '#C99A3E'],
  ['gold', '#C9A15A'],
  ['caramel', '#B0782E'],
  ['whiskey', '#A8662A'],
  ['brown', '#7A5A3C'],
  ['tan', '#C4A46A'],
  ['walnut', '#6B4A32'],
  ['espresso', '#4A3324'],
  ['charcoal', '#3C3830'],
  ['black', '#2B2620'],
  ['grey', '#8B8478'],
  ['gray', '#8B8478'],
  ['slate', '#6E7A7C'],
  ['yellow', '#E8C84A'],
  ['cream', '#EEE2C4'],
  ['orange', '#E08A3C'],
  ['bronze', '#8C6A3E'],
  ['tea', '#C4B587'],
  ['deep red', '#8C1F2B'],
  ['fig', '#4E3550'],
  ['saffron', '#E1A73F'],
  ['rouge', '#B7434F'],
  ['amethyst', '#6B4088'],
  ['candle apple red', '#C8102E'],
];

export function labelColorHex(label: string | null | undefined): string {
  const l = (label || '').toLowerCase();
  for (const [k, v] of LABEL_COLOR_MAP) {
    if (l.includes(k)) return v;
  }
  return '#D8CFBE';
}

export function contrastText(hex: string): string {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.58 ? '#2B2620' : '#FBF7EE';
}

export function softText(hex: string): string {
  const base = contrastText(hex);
  return base === '#2B2620' ? '#6B6357' : '#D9CFC0';
}

export function statusOptions(candles: Candle[]): string[] {
  const set = new Set(candles.map((d) => (d.primary_status || '').trim()).filter(Boolean));
  return ['All', ...Array.from(set).sort()];
}

export function secondaryStatusOptions(candles: Candle[]): string[] {
  const set = new Set<string>();
  candles.forEach((d) => (d.secondary_statuses || []).forEach((s) => s.trim() && set.add(s.trim())));
  return ['All', ...Array.from(set).sort()];
}

export function familyOptions(candles: Candle[]): string[] {
  const set = new Set<string>();
  candles.forEach((d) => {
    let f = (d.family || '').trim();
    if (!f) return;
    f = f.replace('PENDING RETEST — ', '').split('(')[0].trim();
    if (f) set.add(f);
  });
  return Array.from(set).sort();
}

export interface CandleFilters {
  statusFilters: Set<string>;
  secondaryFilters: Set<string>;
  familyFilter: string;
  searchTerm: string;
}

export function matchesFilters(c: Candle, filters: CandleFilters): boolean {
  const { statusFilters, secondaryFilters, familyFilter, searchTerm } = filters;
  if (statusFilters.size > 0 && !statusFilters.has((c.primary_status || '').trim())) return false;
  if (
    secondaryFilters.size > 0 &&
    !(c.secondary_statuses || []).some((s) => secondaryFilters.has(s.trim()))
  )
    return false;
  if (familyFilter && !(c.family || '').includes(familyFilter)) return false;
  if (searchTerm) {
    const hay = [c.name, c.number, c.family, c.derived_from, (c.ingredients || []).join(' ')]
      .join(' ')
      .toLowerCase();
    if (!hay.includes(searchTerm.toLowerCase())) return false;
  }
  return true;
}

export function findByNumber(candles: Candle[], num: string | null | undefined): Candle | null {
  if (!num) return null;
  const target = String(num).trim().toLowerCase();
  return candles.find((d) => String(d.number).trim().toLowerCase() === target) ?? null;
}

export function getChildren(candles: Candle[], num: string | null | undefined): Candle[] {
  if (!num) return [];
  const target = String(num).trim().toLowerCase();
  return candles.filter((d) => String(d.derived_from || '').trim().toLowerCase() === target);
}

export function blankCandle(): Omit<Candle, 'id' | 'created_at' | 'updated_at' | 'sort_order'> {
  return {
    number: '',
    name: '',
    primary_status: 'Pending Creation',
    secondary_statuses: [],
    final_stamp: '',
    family: '',
    depth: '',
    derived_from: '',
    label: '',
    ingredients: [],
    fragrance_load: '',
    batch_size: '2LBS',
    wax: 'Coconut Apricot',
    wick: 'LX-18',
    add_temp: '160',
    pour_temp: '190',
    notes: '',
    archived: false,
    pending_retest: false,
    color_override_hex: null,
    font_override_hex: null,
    launch_phase: null,
    seasonal_tags: [],
  };
}

const PHASE_SORT_RANK: Record<string, number> = { P1: 0, P2: 1, P3: 2 };

function naturalNumberCompare(a: string, b: string): number {
  const parse = (s: string) => {
    const match = s.trim().match(/^(\d+)/);
    return match ? parseInt(match[1], 10) : Number.POSITIVE_INFINITY;
  };
  const diff = parse(a) - parse(b);
  if (diff !== 0) return diff;
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

export function sortCandles(candles: Candle[], sortKey: SortKey): Candle[] {
  const sorted = [...candles];
  switch (sortKey) {
    case 'name':
      sorted.sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }));
      break;
    case 'number':
      sorted.sort((a, b) => naturalNumberCompare(a.number || '', b.number || ''));
      break;
    case 'launch_phase':
      sorted.sort((a, b) => {
        const rankA = a.launch_phase ? PHASE_SORT_RANK[a.launch_phase] : 3;
        const rankB = b.launch_phase ? PHASE_SORT_RANK[b.launch_phase] : 3;
        if (rankA !== rankB) return rankA - rankB;
        return naturalNumberCompare(a.number || '', b.number || '');
      });
      break;
    case 'updated_at':
      sorted.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      break;
  }
  return sorted;
}
