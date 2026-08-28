-- Converts `secondary_status` (a single value) into `secondary_statuses`
-- (an array), so a candle can carry more than one secondary status at once
-- (e.g. both "Re-smell" and "Review Throw").
--
-- This preserves existing data: any candle that already has a secondary
-- status keeps it, now as a one-element array. Safe to re-run — once
-- `secondary_status` has been dropped, later runs are a no-op.

alter table public.candles
  add column if not exists secondary_statuses text[] not null default '{}';

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'candles'
      and column_name = 'secondary_status'
  ) then
    update public.candles
    set secondary_statuses = case
      when secondary_status is null or secondary_status = '' then '{}'::text[]
      else array[secondary_status]
    end;

    alter table public.candles drop column secondary_status;
  end if;
end $$;

comment on column public.candles.secondary_statuses is 'Secondary status tags (Re-smell, Review Throw, etc.) — a candle can carry more than one at once.';
