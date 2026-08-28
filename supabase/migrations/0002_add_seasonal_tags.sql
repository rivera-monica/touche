-- Adds up to 3 free-text seasonal tags per candle (e.g. "Holiday",
-- "Valentine's", "Summer Launch"), shown as badges on the card front. The
-- 3-tag cap is enforced in the UI, not here — the column itself just holds
-- whatever array the app sends.
-- Run this in the Supabase SQL editor on an existing (already-seeded) project —
-- it only adds a column, so it's safe to run without touching existing rows.

alter table public.candles
  add column if not exists seasonal_tags text[] not null default '{}';

comment on column public.candles.seasonal_tags is 'Free-text seasonal labels shown on the card front, e.g. "Holiday" or "Summer Launch". Capped at 3 by the UI. Empty array = no tags.';
