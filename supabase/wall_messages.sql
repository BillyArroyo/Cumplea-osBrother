create table if not exists public.wall_messages (
  id uuid primary key default gen_random_uuid(),
  author text not null check (char_length(btrim(author)) between 1 and 40),
  text text not null check (char_length(btrim(text)) between 1 and 280),
  created_at timestamptz not null default now()
);

alter table public.wall_messages enable row level security;

drop policy if exists "wall_messages_public_read" on public.wall_messages;
create policy "wall_messages_public_read"
  on public.wall_messages for select
  to anon
  using (true);

drop policy if exists "wall_messages_public_insert" on public.wall_messages;
create policy "wall_messages_public_insert"
  on public.wall_messages for insert
  to anon
  with check (true);

revoke update, delete on public.wall_messages from anon;
grant select, insert on public.wall_messages to anon;
