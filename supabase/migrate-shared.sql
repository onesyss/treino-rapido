-- Rode isto se o treino ainda não for o mesmo no tablet e no celular.
-- (SQL Editor do Supabase — cola e Run)

-- 1) Garante tabela + permissões
create table if not exists public.shared_app_state (
  id text primary key default 'main',
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.shared_app_state enable row level security;

drop policy if exists "shared_app_state_select_all" on public.shared_app_state;
create policy "shared_app_state_select_all"
  on public.shared_app_state for select
  to anon, authenticated
  using (true);

drop policy if exists "shared_app_state_insert_all" on public.shared_app_state;
create policy "shared_app_state_insert_all"
  on public.shared_app_state for insert
  to anon, authenticated
  with check (true);

drop policy if exists "shared_app_state_update_all" on public.shared_app_state;
create policy "shared_app_state_update_all"
  on public.shared_app_state for update
  to anon, authenticated
  using (true)
  with check (true);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.shared_app_state to anon, authenticated;

-- 2) Copia o treino mais recente de qualquer usuário para o shared
insert into public.shared_app_state (id, data)
select 'main', data
from public.app_state
order by updated_at desc nulls last
limit 1
on conflict (id) do update
  set data = excluded.data,
      updated_at = now();
