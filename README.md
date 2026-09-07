# Flux Board

A polished Kanban task board with guest accounts, drag-and-drop, teams, and labels — built for the Task Board Assessment Challenge.

**Live app:** _added after deploy_
**Stack:** React 19 + TypeScript + Vite, Tailwind CSS v4, dnd-kit, Supabase (Postgres + Auth + Realtime), hosted on Vercel.

## Features

- Four-column Kanban board (To Do / In Progress / In Review / Done) with smooth drag-and-drop between and within columns, backed by dnd-kit.
- Guest accounts via Supabase anonymous auth — a session is created automatically on first load, and Row Level Security scopes every row to that guest.
- Realtime sync: the board subscribes to Postgres changes, so edits reflect instantly across tabs/devices for the same guest.
- Team members with colored avatar initials, assignable to any task.
- Custom labels with board-wide filtering.
- Due date badges that flag "due soon" and "overdue" tasks.
- Search by title, plus filters for priority, assignee, and label.
- A live stats bar (total, in flight, completed, overdue).
- Loading skeletons, empty states, and inline error banners throughout.

## Local setup

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project URL + anon key
npm run dev
```

The app needs two environment variables (see `.env.example`):

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-public-key>
```

## Database

Run `supabase-schema.sql` in the Supabase SQL editor (or `supabase db push` if you're using the CLI) against a fresh project. It creates `tasks`, `team_members`, `labels`, and the `task_assignees` / `task_labels` join tables, enables Row Level Security on all five, and adds `auth.uid() = user_id` (or derived-ownership) policies so each guest can only ever see their own data.

You'll also need to turn on **Authentication → Sign In / Providers → Anonymous Sign-Ins** in the Supabase dashboard — it's off by default on new projects.

## Project structure

```
src/
  components/   UI components (Board, Column, TaskCard, TaskModal, ...)
  hooks/        useAuth (guest session), useBoard (all CRUD + realtime)
  lib/          Supabase client
  types.ts      Shared TypeScript types
supabase-schema.sql   Full schema + RLS policies
```

## Deploying

The app is a static Vite build — deploy the `dist/` folder to Vercel, Netlify, or Cloudflare Pages, and set the two `VITE_SUPABASE_*` env vars in the hosting provider's dashboard.
