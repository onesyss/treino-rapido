# Supabase — treino igual no tablet e no celular

## Obrigatório (1x)
No **SQL Editor** do Supabase, rode **na ordem**:

1. `supabase/schema.sql` (cria tudo)
2. `supabase/migrate-shared.sql` (copia treinos antigos → shared)

Ou só o `migrate-shared.sql` se a tabela `app_state` já existir.

## Como funciona
- **Um único** registro: `shared_app_state` com `id = main`
- Tablet salva → nuvem → celular carrega o **mesmo** JSON
- Ao reabrir o app, puxa de novo a nuvem
- Aparelho vazio **não apaga** o treino preenchido

## Conferir
- Badge no app: **Salvo na nuvem**
- Se aparecer erro de `shared_app_state`, o SQL ainda não rodou

## Auth
Ative **Authentication → Providers → Anonymous**.
