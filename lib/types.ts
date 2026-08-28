export type LaunchPhase = 'P1' | 'P2' | 'P3';

export const PRIMARY_STATUSES = ['Fill', 'Kill', 'Pending Creation', 'Revisit'] as const;
export type PrimaryStatus = (typeof PRIMARY_STATUSES)[number];

export const SECONDARY_STATUSES = [
  'Re-smell',
  'Review Throw',
  'Review Wick',
  'Review Melt',
  'Check For Overlaps',
  'Dead',
  'Check Complete',
] as const;
export type SecondaryStatus = (typeof SECONDARY_STATUSES)[number];

export type Candle = {
  id: string;
  sort_order: number;
  number: string;
  name: string;
  final_stamp: string;
  family: string;
  depth: string;
  label: string;
  ingredients: string[];
  fragrance_load: string;
  batch_size: string;
  wax: string;
  wick: string;
  add_temp: string;
  pour_temp: string;
  notes: string;
  archived: boolean;
  pending_retest: boolean;
  color_override_hex: string | null;
  font_override_hex: string | null;
  launch_phase: LaunchPhase | null;
  primary_status: string;
  secondary_status: string;
  derived_from: string;
  seasonal_tags: string[];
  created_at: string;
  updated_at: string;
};

export type CandleDraft = Omit<Candle, 'id' | 'created_at' | 'updated_at' | 'sort_order'>;

export const MAX_SEASONAL_TAGS = 3;

export const SORT_OPTIONS = [
  { value: 'name', label: 'Name (A–Z)' },
  { value: 'number', label: 'Candle number' },
  { value: 'launch_phase', label: 'Launch phase' },
  { value: 'updated_at', label: 'Recently updated' },
] as const;
export type SortKey = (typeof SORT_OPTIONS)[number]['value'];
