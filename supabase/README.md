# Supabase setup — Treino de Marlon Miranda

## 1. Criar projeto
1. Acesse [https://supabase.com](https://supabase.com) e crie um projeto.
2. Abra **SQL Editor** e execute o arquivo `supabase/schema.sql` **inteiro**.

## 2. Auth anônimo
1. Vá em **Authentication → Providers**.
2. Ative **Anonymous Sign-Ins**.

## 3. Variáveis de ambiente (React + Vite)
No `.env` (já versionado com as chaves publicáveis):

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

## 4. Como os dados ficam iguais em todos os lugares
O app usa a tabela **`shared_app_state`** (id = `main`):
- mesmo treino no localhost, Netlify, GitHub Pages, celular
- também espelha em `localStorage` e em `app_state` (backup por user)

### Se você JÁ preencheu em algum browser
No SQL Editor do Supabase, rode (depois do schema):

```sql
insert into public.shared_app_state (id, data)
select 'main', data
from public.app_state
order by updated_at desc nulls last
limit 1
on conflict (id) do update
  set data = excluded.data,
      updated_at = now();
```

Isso copia a linha mais recente do treino preenchido para o estado compartilhado.
Depois abra o app em qualquer URL: os pesos/reps já devem aparecer.

## 5. Tabelas
| Tabela | Uso |
|--------|-----|
| `shared_app_state` | treino único compartilhado |
| `app_state` | backup por usuário anônimo |
