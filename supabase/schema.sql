create extension if not exists "pgcrypto";

create table if not exists public.commission_reports (
  id uuid primary key default gen_random_uuid(),
  target_id text not null check (char_length(target_id) <= 100),
  platform text not null check (char_length(platform) <= 50),
  status text not null default '待核实'
    check (status in ('待核实', '已公开', '已隐藏', '已解决')),
  days_missing integer not null check (days_missing >= 10),
  last_contact date not null,
  evidence_url text not null,
  description text not null check (char_length(description) <= 5000),
  submitter_contact text check (submitter_contact is null or char_length(submitter_contact) <= 200),
  report_count integer not null default 1 check (report_count >= 1),
  is_public boolean not null default false,
  is_resolved boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.report_appeals (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.commission_reports(id) on delete cascade,
  contact text not null check (char_length(contact) <= 200),
  statement text not null check (char_length(statement) <= 3000),
  status text not null default '待处理'
    check (status in ('待处理', '处理中', '已接受', '已拒绝')),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.report_evidence_submissions (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.commission_reports(id) on delete cascade,
  contact text check (contact is null or char_length(contact) <= 200),
  description text not null check (char_length(description) <= 3000),
  evidence_url text not null,
  review_status text not null default '待处理'
    check (review_status in ('待处理', '已通过', '已拒绝')),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.submission_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (char_length(event_type) <= 80),
  status text not null check (char_length(status) <= 80),
  record_id uuid,
  target_id text,
  platform text,
  ip_address text,
  user_agent text,
  flags jsonb,
  error_message text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.admin_action_logs (
  id uuid primary key default gen_random_uuid(),
  actor_label text not null default 'platform_admin',
  action text not null check (char_length(action) <= 80),
  target_type text not null check (char_length(target_type) <= 80),
  target_id text not null,
  report_id uuid,
  ip_address text,
  user_agent text,
  details jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_commission_reports_target_id
  on public.commission_reports(target_id);

create index if not exists idx_commission_reports_created_at
  on public.commission_reports(created_at desc);

create index if not exists idx_report_appeals_report_id
  on public.report_appeals(report_id);

create index if not exists idx_report_evidence_submissions_report_id
  on public.report_evidence_submissions(report_id);

create index if not exists idx_submission_events_created_at
  on public.submission_events(created_at desc);

create index if not exists idx_submission_events_ip_address
  on public.submission_events(ip_address);

create index if not exists idx_submission_events_target_id
  on public.submission_events(target_id);

create index if not exists idx_admin_action_logs_created_at
  on public.admin_action_logs(created_at desc);

alter table public.commission_reports enable row level security;
alter table public.report_appeals enable row level security;
alter table public.report_evidence_submissions enable row level security;
alter table public.submission_events enable row level security;
alter table public.admin_action_logs enable row level security;

drop policy if exists "public can read visible reports" on public.commission_reports;
create policy "public can read visible reports"
on public.commission_reports
for select
to anon, authenticated
using (is_public = true and status = '已公开');

drop policy if exists "public cannot directly write reports" on public.commission_reports;
create policy "public cannot directly write reports"
on public.commission_reports
for insert
to anon, authenticated
with check (false);

drop policy if exists "public cannot update reports" on public.commission_reports;
create policy "public cannot update reports"
on public.commission_reports
for update
to anon, authenticated
using (false);

drop policy if exists "no public delete reports" on public.commission_reports;
create policy "no public delete reports"
on public.commission_reports
for delete
to anon, authenticated
using (false);

drop policy if exists "public can submit appeals" on public.report_appeals;
create policy "public can submit appeals"
on public.report_appeals
for insert
to anon, authenticated
with check (true);

drop policy if exists "public cannot read appeals" on public.report_appeals;
create policy "public cannot read appeals"
on public.report_appeals
for select
to anon, authenticated
using (false);

drop policy if exists "public can submit evidence" on public.report_evidence_submissions;
create policy "public can submit evidence"
on public.report_evidence_submissions
for insert
to anon, authenticated
with check (true);

drop policy if exists "public cannot read evidence" on public.report_evidence_submissions;
create policy "public cannot read evidence"
on public.report_evidence_submissions
for select
to anon, authenticated
using (false);

drop policy if exists "public cannot read submission events" on public.submission_events;
create policy "public cannot read submission events"
on public.submission_events
for select
to anon, authenticated
using (false);

drop policy if exists "public cannot write submission events" on public.submission_events;
create policy "public cannot write submission events"
on public.submission_events
for insert
to anon, authenticated
with check (false);

drop policy if exists "public cannot read admin logs" on public.admin_action_logs;
create policy "public cannot read admin logs"
on public.admin_action_logs
for select
to anon, authenticated
using (false);

drop policy if exists "public cannot write admin logs" on public.admin_action_logs;
create policy "public cannot write admin logs"
on public.admin_action_logs
for insert
to anon, authenticated
with check (false);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('evidence', 'evidence', false, 5242880, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "no direct public read evidence files" on storage.objects;
create policy "no direct public read evidence files"
on storage.objects
for select
to anon, authenticated
using (false);

drop policy if exists "no direct public upload evidence files" on storage.objects;
create policy "no direct public upload evidence files"
on storage.objects
for insert
to anon, authenticated
with check (false);
