-- Touché candle recipe catalog schema.
-- Run this in the Supabase SQL editor (or via `supabase db push`) before seeding data.

create extension if not exists "pgcrypto";

create table if not exists public.candles (
  id                   uuid primary key default gen_random_uuid(),
  sort_order           integer not null,
  number               text not null default '',
  name                 text not null default '',
  final_stamp          text not null default '',
  family               text not null default '',
  depth                text not null default '',
  label                text not null default '',
  ingredients          text[] not null default '{}',
  fragrance_load       text not null default '',
  batch_size           text not null default '',
  wax                  text not null default '',
  wick                 text not null default '',
  add_temp             text not null default '',
  pour_temp            text not null default '',
  notes                text not null default '',
  archived             boolean not null default false,
  pending_retest       boolean not null default false,
  color_override_hex   text,
  font_override_hex    text,
  launch_phase         text check (launch_phase in ('P1', 'P2', 'P3')),
  primary_status       text not null default 'Pending Creation',
  secondary_status     text not null default '',
  -- Candle lineage: the parent's `number`, not a DB foreign key. Candle
  -- numbers are not unique in this catalog (e.g. two historical entries are
  -- both numbered "0"), so lineage is resolved the same way the original
  -- dashboard did it — by matching text on `number` at read time — rather
  -- than a strict FK, which duplicate numbers would make ambiguous.
  derived_from         text not null default '',
  created_by           uuid references auth.users(id),
  updated_by           uuid references auth.users(id),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

comment on table public.candles is 'Touché candle recipe catalog — one row per recipe card.';
comment on column public.candles.derived_from is 'Parent candle''s `number` (text match, not an FK — numbers are not unique).';
comment on column public.candles.sort_order is 'Preserves the original dashboard''s card ordering.';

create index if not exists candles_number_idx on public.candles (number);
create index if not exists candles_derived_from_idx on public.candles (derived_from) where derived_from <> '';
create index if not exists candles_sort_order_idx on public.candles (sort_order);

-- Keep updated_at current on every row change.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists candles_set_updated_at on public.candles;
create trigger candles_set_updated_at
  before update on public.candles
  for each row
  execute function public.set_updated_at();

-- Row Level Security: any signed-in team member can read and edit the whole
-- shared catalog. There's no per-row ownership model here — it's a small
-- team collaborating on one catalog.
alter table public.candles enable row level security;

drop policy if exists "authenticated can read candles" on public.candles;
create policy "authenticated can read candles"
  on public.candles for select
  to authenticated
  using (true);

drop policy if exists "authenticated can insert candles" on public.candles;
create policy "authenticated can insert candles"
  on public.candles for insert
  to authenticated
  with check (true);

drop policy if exists "authenticated can update candles" on public.candles;
create policy "authenticated can update candles"
  on public.candles for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "authenticated can delete candles" on public.candles;
create policy "authenticated can delete candles"
  on public.candles for delete
  to authenticated
  using (true);

-- Stamp created_by/updated_by from the session automatically so edits are
-- attributable without the client having to pass it explicitly.
create or replace function public.set_candle_audit_fields()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by = auth.uid();
    new.updated_by = auth.uid();
  elsif tg_op = 'UPDATE' then
    new.created_by = old.created_by;
    new.updated_by = auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists candles_set_audit_fields on public.candles;
create trigger candles_set_audit_fields
  before insert or update on public.candles
  for each row
  execute function public.set_candle_audit_fields();

-- Enable realtime so edits from one team member show up live for everyone
-- else viewing the dashboard.
alter publication supabase_realtime add table public.candles;
