/** SQL que o usuário cola no Supabase (SQL Editor → Run). */
export const SHARED_SETUP_SQL = `-- Cole isto no Supabase → SQL Editor → Run
-- Cria a tabela que sincroniza tablet e celular

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

drop policy if exists "shared_app_state_delete_all" on public.shared_app_state;
create policy "shared_app_state_delete_all"
  on public.shared_app_state for delete
  to anon, authenticated
  using (true);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.shared_app_state to anon, authenticated;

-- Copia treino já salvo (se houver) para o shared
insert into public.shared_app_state (id, data)
select 'main', data
from public.app_state
order by updated_at desc nulls last
limit 1
on conflict (id) do update
  set data = excluded.data,
      updated_at = now();
`

export function isSharedTableMissingError(message: string | null | undefined): boolean {
  if (!message) return false
  return /shared_app_state|schema cache|Could not find the table/i.test(message)
}
