-- Adds a free-text seasonal tag to each candle (e.g. "Holiday", "Valentine's",
-- "Summer Launch"), shown as a badge on the card front.
-- Run this in the Supabase SQL editor on an existing (already-seeded) project —
-- it only adds a column, so it's safe to run without touching existing rows.

alter table public.candles
  add column if not exists seasonal_tag text not null default '';

comment on column public.candles.seasonal_tag is 'Free-text seasonal label shown on the card front, e.g. "Holiday" or "Summer Launch". Empty string = no tag.';
