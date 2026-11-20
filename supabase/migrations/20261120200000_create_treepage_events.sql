-- TreePage first-party product events.
-- This project also stores other sites in public.visits, public.form_send_log,
-- and public.octagonelo_events. This migration only creates public.treepage_events
-- and public.telemetry_config. It does not alter those tables.
--
-- Writes come from the treepage-track Edge Function with the service role key,
-- which bypasses RLS. RLS is enabled and forced, and no policies are created, so
-- anon and authenticated clients cannot read or write these tables.

create table public.treepage_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  event text not null,
  path text,
  referrer_domain text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  experiment_key text,
  variant text,
  device_class text,
  country text,
  session_id text not null,
  props jsonb not null default '{}'::jsonb,
  constraint treepage_events_event_len check (char_length(event) between 1 and 64),
  constraint treepage_events_path_len check (path is null or char_length(path) <= 200),
  constraint treepage_events_referrer_len check (referrer_domain is null or char_length(referrer_domain) <= 253),
  constraint treepage_events_utm_source_len check (utm_source is null or char_length(utm_source) <= 64),
  constraint treepage_events_utm_medium_len check (utm_medium is null or char_length(utm_medium) <= 64),
  constraint treepage_events_utm_campaign_len check (utm_campaign is null or char_length(utm_campaign) <= 64),
  constraint treepage_events_experiment_key_len check (experiment_key is null or char_length(experiment_key) <= 40),
  constraint treepage_events_variant_len check (variant is null or char_length(variant) <= 32),
  constraint treepage_events_device_class check (device_class is null or device_class in ('mobile', 'desktop')),
  constraint treepage_events_country check (country is null or country ~ '^[A-Z]{2}$'),
  constraint treepage_events_session_len check (char_length(session_id) between 8 and 64),
  constraint treepage_events_props_object check (jsonb_typeof(props) = 'object')
);

comment on table public.treepage_events is
  'TreePage product telemetry. Session ids are daily salted hashes. No IP, user agent, or full referrer URL.';

create index treepage_events_created_at_idx
  on public.treepage_events (created_at);

create index treepage_events_event_idx
  on public.treepage_events (event);

alter table public.treepage_events enable row level security;
alter table public.treepage_events force row level security;

revoke all on table public.treepage_events from PUBLIC;
revoke all on table public.treepage_events from anon;
revoke all on table public.treepage_events from authenticated;

grant insert, select on table public.treepage_events to service_role;
grant usage, select on sequence public.treepage_events_id_seq to service_role;

-- Salt for the daily session hash. The Edge Function reads key = treepage_salt
-- when TELEMETRY_SALT is not set, so no manual secret is required.
create table public.telemetry_config (
  key text primary key,
  value text not null,
  constraint telemetry_config_key_len check (char_length(key) between 1 and 64),
  constraint telemetry_config_value_len check (char_length(value) between 16 and 256)
);

comment on table public.telemetry_config is
  'Private telemetry settings. Readable only by service_role. treepage_salt is the TreePage session-hash salt.';

alter table public.telemetry_config enable row level security;
alter table public.telemetry_config force row level security;

revoke all on table public.telemetry_config from PUBLIC;
revoke all on table public.telemetry_config from anon;
revoke all on table public.telemetry_config from authenticated;

grant select on table public.telemetry_config to service_role;

insert into public.telemetry_config (key, value)
select 'treepage_salt', encode(extensions.gen_random_bytes(32), 'hex')
where not exists (
  select 1 from public.telemetry_config where key = 'treepage_salt'
);
