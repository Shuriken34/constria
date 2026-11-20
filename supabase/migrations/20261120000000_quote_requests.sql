-- Cererile de ofertă trimise din formularul de pe site.
-- Vizitatorii (anon) și utilizatorii logați pot doar ADĂUGA cereri.
-- Doar administratorii (is_admin()) le pot citi și actualiza.
-- Le vezi și din Supabase Dashboard → Table Editor → quote_requests.

create table public.quote_requests (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 2 and 120),
  phone text not null check (char_length(phone) between 6 and 30),
  locality text not null check (char_length(locality) between 2 and 120),
  service text not null check (
    service in (
      'acoperis-nou', 'schimbare-acoperis', 'vopsire-acoperis',
      'garduri', 'foisoare', 'terase', 'altceva'
    )
  ),
  message text check (char_length(message) <= 2000),
  status text not null default 'nou'
    check (status in ('nou', 'contactat', 'ofertat', 'castigat', 'pierdut'))
);

comment on table public.quote_requests is 'Cereri de ofertă din formularul site-ului Constria.';

create index quote_requests_created_at_idx on public.quote_requests (created_at desc);

alter table public.quote_requests enable row level security;

revoke all on public.quote_requests from anon, authenticated;
grant insert (name, phone, locality, service, message) on public.quote_requests to anon, authenticated;
grant select, update (status) on public.quote_requests to authenticated;

create policy quote_insert_public
  on public.quote_requests
  for insert
  to anon, authenticated
  with check (status = 'nou');

create policy quote_admin_select
  on public.quote_requests
  for select
  to authenticated
  using ((select public.is_admin()));

create policy quote_admin_update
  on public.quote_requests
  for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
