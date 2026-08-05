# Supabase setup — Treino de Marlon Miranda

## 1. Criar projeto
1. Acesse [https://supabase.com](https://supabase.com) e crie um projeto.
2. Abra **SQL Editor** e execute o arquivo `supabase/schema.sql`.

## 2. Auth anônimo
1. Vá em **Authentication → Providers**.
2. Ative **Anonymous Sign-Ins** (necessário para o app salvar sem login com e-mail).

## 3. Variáveis de ambiente (React + Vite)
1. Em **Project Settings → API**, copie:
   - Project URL
   - **Publishable key** (`sb_publishable_...`)
2. Na raiz do projeto, arquivo `.env`:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

3. Reinicie: `npm run dev` (o Vite só lê o `.env` no start)

## 4. Comportamento
- O app **não usa mais localStorage** para persistir o treino.
- Ao abrir: autenticação anônima + carrega `app_state` do usuário.
- Se existir dado antigo no browser (v5–v8), **migra uma vez** para o Supabase e limpa o local.
- Alterações são salvas na nuvem com debounce (~500 ms).

## 5. Tabela
| Tabela | Uso |
|--------|-----|
| `app_state` | `user_id` + `data` (JSONB com workouts, sessões, entries) |

RLS: cada usuário só acessa a própria linha.
