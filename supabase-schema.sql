-- Flux Board — full database schema (tables, indexes, RLS policies)
-- Run this in the Supabase SQL editor, or via `supabase db push` locally.

create extension if not exists "pgcrypto";

-- ── Team members ─────────────────────────────────────────────
create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null default '#5b5bf6',
  created_at timestamptz not null default now()
);

-- ── Labels ────────────────────────────────────────────────────
create table if not exists public.labels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null default '#5b5bf6',
  created_at timestamptz not null default now()
);

-- ── Tasks ─────────────────────────────────────────────────────
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  description text,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'in_review', 'done')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  due_date date,
  position double precision not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_user_id_idx on public.tasks (user_id);
create index if not exists tasks_status_idx on public.tasks (user_id, status);

-- ── Task <-> team member assignments (many-to-many) ─────────
create table if not exists public.task_assignees (
  task_id uuid not null references public.tasks(id) on delete cascade,
  member_id uuid not null references public.team_members(id) on delete cascade,
  primary key (task_id, member_id)
);

-- ── Task <-> labels (many-to-many) ──────────────────────────
create table if not exists public.task_labels (
  task_id uuid not null references public.tasks(id) on delete cascade,
  label_id uuid not null references public.labels(id) on delete cascade,
  primary key (task_id, label_id)
);

-- ── Row Level Security ───────────────────────────────────────
alter table public.tasks enable row level security;
alter table public.team_members enable row level security;
alter table public.labels enable row level security;
alter table public.task_assignees enable row level security;
alter table public.task_labels enable row level security;

-- Tasks: guests can only see and modify their own rows
create policy "tasks_select_own" on public.tasks for select using (auth.uid() = user_id);
create policy "tasks_insert_own" on public.tasks for insert with check (auth.uid() = user_id);
create policy "tasks_update_own" on public.tasks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "tasks_delete_own" on public.tasks for delete using (auth.uid() = user_id);

-- Team members: same pattern
create policy "team_members_select_own" on public.team_members for select using (auth.uid() = user_id);
create policy "team_members_insert_own" on public.team_members for insert with check (auth.uid() = user_id);
create policy "team_members_update_own" on public.team_members for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "team_members_delete_own" on public.team_members for delete using (auth.uid() = user_id);

-- Labels: same pattern
create policy "labels_select_own" on public.labels for select using (auth.uid() = user_id);
create policy "labels_insert_own" on public.labels for insert with check (auth.uid() = user_id);
create policy "labels_update_own" on public.labels for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "labels_delete_own" on public.labels for delete using (auth.uid() = user_id);

-- task_assignees: ownership is derived from the parent task
create policy "task_assignees_select_own" on public.task_assignees for select
  using (exists (select 1 from public.tasks t where t.id = task_id and t.user_id = auth.uid()));
create policy "task_assignees_insert_own" on public.task_assignees for insert
  with check (exists (select 1 from public.tasks t where t.id = task_id and t.user_id = auth.uid()));
create policy "task_assignees_delete_own" on public.task_assignees for delete
  using (exists (select 1 from public.tasks t where t.id = task_id and t.user_id = auth.uid()));

-- task_labels: same derived-ownership pattern
create policy "task_labels_select_own" on public.task_labels for select
  using (exists (select 1 from public.tasks t where t.id = task_id and t.user_id = auth.uid()));
create policy "task_labels_insert_own" on public.task_labels for insert
  with check (exists (select 1 from public.tasks t where t.id = task_id and t.user_id = auth.uid()));
create policy "task_labels_delete_own" on public.task_labels for delete
  using (exists (select 1 from public.tasks t where t.id = task_id and t.user_id = auth.uid()));

-- Keep updated_at fresh on every task update
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();
