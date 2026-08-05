-- Atalho: só o que o app precisa para sync multi-aparelho (cole no SQL Editor e Run)
-- https://supabase.com/dashboard/project/qjkdtipsshfjqttbpwpj/sql/new

create table if not exists public.treino_sync (
  id text primary key default 'main',
  profile_name text not null default 'Marlon Miranda',
  active_workout_id text not null default '',
  active_session_id text,
  workouts jsonb not null default '[]'::jsonb,
  sessions jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.treino_sync enable row level security;

drop policy if exists "treino_sync_all" on public.treino_sync;
create policy "treino_sync_all"
  on public.treino_sync for all
  to anon, authenticated
  using (true)
  with check (true);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.treino_sync to anon, authenticated;

insert into public.treino_sync (id, profile_name, workouts, sessions)
values ('main', 'Marlon Miranda', '[]'::jsonb, '[]'::jsonb)
on conflict (id) do nothing;

-- Se já tinha shared_app_state / app_state, copia
do $$
declare src jsonb;
begin
  begin
    select data into src from public.shared_app_state where id = 'main' limit 1;
  exception when undefined_table then src := null;
  end;
  if src is null then
    begin
      select data into src from public.app_state order by updated_at desc nulls last limit 1;
    exception when undefined_table then src := null;
    end;
  end if;
  if src is not null and jsonb_typeof(src->'workouts') = 'array'
     and jsonb_array_length(src->'workouts') > 0 then
    update public.treino_sync set
      profile_name = coalesce(src->>'profileName', 'Marlon Miranda'),
      active_workout_id = coalesce(src->>'activeWorkoutId', ''),
      active_session_id = src->>'activeSessionId',
      workouts = coalesce(src->'workouts', '[]'::jsonb),
      sessions = coalesce(src->'sessions', '[]'::jsonb),
      updated_at = now()
    where id = 'main';
  end if;
end $$;
