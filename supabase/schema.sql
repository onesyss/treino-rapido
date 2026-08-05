-- =============================================================================
-- Treino de Marlon Miranda — schema COMPLETO (rode 1x no SQL Editor)
-- Projeto: https://supabase.com/dashboard/project/qjkdtipsshfjqttbpwpj/sql/new
--
-- Cria as tabelas com COLUNAS reais. App e todos os aparelhos leem/gravam a
-- mesma linha id='main' (sem login diferente por celular).
-- =============================================================================

-- 1) Fonte principal: uma linha = treino inteiro (tablet = celular)
create table if not exists public.treino_sync (
  id text primary key default 'main',
  profile_name text not null default 'Marlon Miranda',
  active_workout_id text not null default '',
  active_session_id text,
  -- listagens do app (arrays de objetos)
  workouts jsonb not null default '[]'::jsonb,
  sessions jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- 2) Backup legado (JSON único por user anônimo — mantido se já existir)
create table if not exists public.app_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.shared_app_state (
  id text primary key default 'main',
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists treino_sync_updated_at on public.treino_sync;
create trigger treino_sync_updated_at
  before update on public.treino_sync
  for each row execute function public.set_updated_at();

drop trigger if exists app_state_updated_at on public.app_state;
create trigger app_state_updated_at
  before update on public.app_state
  for each row execute function public.set_updated_at();

drop trigger if exists shared_app_state_updated_at on public.shared_app_state;
create trigger shared_app_state_updated_at
  before update on public.shared_app_state
  for each row execute function public.set_updated_at();

-- RLS (app pessoal: chave publishable no front)
alter table public.treino_sync enable row level security;
alter table public.app_state enable row level security;
alter table public.shared_app_state enable row level security;

-- treino_sync: qualquer um com a chave do app lê/escreve a linha main
drop policy if exists "treino_sync_all" on public.treino_sync;
create policy "treino_sync_all"
  on public.treino_sync for all
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "shared_app_state_all" on public.shared_app_state;
create policy "shared_app_state_all"
  on public.shared_app_state for all
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "app_state_select_own" on public.app_state;
create policy "app_state_select_own"
  on public.app_state for select
  to authenticated, anon
  using (auth.uid() = user_id);

drop policy if exists "app_state_insert_own" on public.app_state;
create policy "app_state_insert_own"
  on public.app_state for insert
  to authenticated, anon
  with check (auth.uid() = user_id);

drop policy if exists "app_state_update_own" on public.app_state;
create policy "app_state_update_own"
  on public.app_state for update
  to authenticated, anon
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.treino_sync to anon, authenticated;
grant select, insert, update, delete on public.shared_app_state to anon, authenticated;
grant select, insert, update, delete on public.app_state to anon, authenticated;

-- 3) Garante linha main (vazia até o app popular — ou migrada abaixo)
insert into public.treino_sync (id, profile_name, workouts, sessions)
values ('main', 'Marlon Miranda', '[]'::jsonb, '[]'::jsonb)
on conflict (id) do nothing;

-- 4) Migra dados já existentes em shared_app_state / app_state → treino_sync
do $$
declare
  src jsonb;
  src_profile text;
begin
  select data into src
  from public.shared_app_state
  where id = 'main'
  limit 1;

  if src is null then
    select data into src
    from public.app_state
    order by updated_at desc nulls last
    limit 1;
  end if;

  if src is not null and jsonb_typeof(src->'workouts') = 'array'
     and jsonb_array_length(src->'workouts') > 0 then
    src_profile := coalesce(src->>'profileName', 'Marlon Miranda');
    update public.treino_sync
    set
      profile_name = src_profile,
      active_workout_id = coalesce(src->>'activeWorkoutId', ''),
      active_session_id = src->>'activeSessionId',
      workouts = coalesce(src->'workouts', '[]'::jsonb),
      sessions = coalesce(src->'sessions', '[]'::jsonb),
      updated_at = now()
    where id = 'main';
  end if;
end $$;
