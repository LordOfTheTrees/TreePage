-- Global rate limiting for the contact and feedback forms.
--
-- Deliberately stores NO identifier: one row per successful send, holding only
-- which endpoint sent it and when. There is no IP, no hash, no session, and
-- nothing that narrows to a person, so this does not affect the site's privacy
-- position (see docs/analytics.md). The limit is global, not per-visitor.

create table if not exists public.form_send_log (
  id bigint generated always as identity primary key,
  endpoint text not null,
  created_at timestamptz not null default now()
);

-- The only query shape used: count rows for one endpoint since a cutoff.
create index if not exists form_send_log_endpoint_created_at_idx
  on public.form_send_log (endpoint, created_at desc);

alter table public.form_send_log enable row level security;

create policy "Allow anonymous inserts"
  on public.form_send_log for insert to anon
  with check (endpoint in ('send-contact', 'send-feedback'));

create policy "Allow anonymous reads"
  on public.form_send_log for select to anon
  using (true);

create policy "Allow anonymous prune"
  on public.form_send_log for delete to anon
  using (created_at < now() - interval '7 days');
