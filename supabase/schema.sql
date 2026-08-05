-- Treino de Marlon Miranda — schema Supabase
-- Rode este SQL no SQL Editor do projeto Supabase (Dashboard → SQL → New query)

-- Estado completo do app (workouts, sessões, entries) em JSONB
create table if not exists public.app_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists app_state_updated_at_idx on public.app_state (updated_at desc);

alter table public.app_state enable row level security;

-- Cada usuário só lê/escreve o próprio estado
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

-- Atualiza updated_at automaticamente
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

/*
Depois:
1. Authentication → Providers → enable Anonymous (se disponível)
   OU use a política abaixo se preferir chave pública única sem login
   (apenas para uso pessoal — NÃO recomendado em produção pública)

2. Em Project Settings → API, copie:
   - Project URL  → VITE_SUPABASE_URL
   - anon public  → VITE_SUPABASE_ANON_KEY
*/
