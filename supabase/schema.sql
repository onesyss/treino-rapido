-- Treino de Marlon Miranda — schema Supabase
-- Rode este SQL no SQL Editor do projeto Supabase (Dashboard → SQL → New query)

-- ---------------------------------------------------------------------------
-- 1) Estado por usuário (legado / backup)
-- ---------------------------------------------------------------------------
create table if not exists public.app_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists app_state_updated_at_idx on public.app_state (updated_at desc);

alter table public.app_state enable row level security;

drop policy if exists "app_state_select_own" on public.app_state;
create policy "app_state_select_own"
  on public.app_state for select
  using (auth.uid() = user_id);

drop policy if exists "app_state_insert_own" on public.app_state;
create policy "app_state_insert_own"
  on public.app_state for insert
  with check (auth.uid() = user_id);

drop policy if exists "app_state_update_own" on public.app_state;
create policy "app_state_update_own"
  on public.app_state for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "app_state_delete_own" on public.app_state;
create policy "app_state_delete_own"
  on public.app_state for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 2) Estado COMPARTILHADO (mesmos dados em todos os aparelhos / abas)
--    Uso pessoal: anon key no front já é pública.
-- ---------------------------------------------------------------------------
create table if not exists public.shared_app_state (
  id text primary key default 'main',
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.shared_app_state enable row level security;

-- Leitura/escrita aberta para a chave publishable (app pessoal)
drop policy if exists "shared_app_state_select_all" on public.shared_app_state;
create policy "shared_app_state_select_all"
  on public.shared_app_state for select
  using (true);

drop policy if exists "shared_app_state_insert_all" on public.shared_app_state;
create policy "shared_app_state_insert_all"
  on public.shared_app_state for insert
  with check (true);

drop policy if exists "shared_app_state_update_all" on public.shared_app_state;
create policy "shared_app_state_update_all"
  on public.shared_app_state for update
  using (true)
  with check (true);

drop policy if exists "shared_app_state_delete_all" on public.shared_app_state;
create policy "shared_app_state_delete_all"
  on public.shared_app_state for delete
  using (true);

-- updated_at
create or replace function public.set_app_state_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists app_state_set_updated_at on public.app_state;
create trigger app_state_set_updated_at
  before update on public.app_state
  for each row execute function public.set_app_state_updated_at();

drop trigger if exists shared_app_state_set_updated_at on public.shared_app_state;
create trigger shared_app_state_set_updated_at
  before update on public.shared_app_state
  for each row execute function public.set_app_state_updated_at();

-- ---------------------------------------------------------------------------
-- 3) MIGRAÇÃO: se você já preencheu em algum browser, rode isto DEPOIS do create
--    Copia a linha mais recente de app_state → shared (dados únicos para todos)
-- ---------------------------------------------------------------------------
/*
insert into public.shared_app_state (id, data)
select 'main', data
from public.app_state
order by updated_at desc nulls last
limit 1
on conflict (id) do update
  set data = excluded.data,
      updated_at = now();
*/
