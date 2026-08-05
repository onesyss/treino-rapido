/** SQL único — cola no Supabase SQL Editor (cria colunas e permite multi-aparelho). */
export const SHARED_SETUP_SQL = `-- Cole no Supabase → SQL Editor → Run
-- Cria a tabela treino_sync com colunas reais (perfil, treinos, sessões)
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
`

export function isSharedTableMissingError(message: string | null | undefined): boolean {
  if (!message) return false
  return (
    /treino_sync|shared_app_state|schema cache|Could not find the table|PGRST205/i.test(
      message
    )
  )
}
