# Supabase — treino em qualquer aparelho

O app **não consegue criar tabelas sozinho** (a chave do front é só leitura/escrita de
dados, não de schema). Você cria **uma vez** no SQL Editor.

## 1. Criar as colunas no banco (1x)

1. Abra: https://supabase.com/dashboard/project/qjkdtipsshfjqttbpwpj/sql/new  
2. Cole o conteúdo de `supabase/migrate-shared.sql` (ou o SQL do botão no app)  
3. **Run**

Isso cria a tabela **`treino_sync`** com colunas:

| Coluna | Conteúdo |
|--------|----------|
| `id` | sempre `main` (mesmo treino pra todos) |
| `profile_name` | nome do atleta |
| `active_workout_id` | ficha ativa |
| `active_session_id` | sessão ativa |
| `workouts` | treinos + exercícios (JSON) |
| `sessions` | sessões + pesos/reps (JSON) |
| `updated_at` | última gravação |

## 2. Auth anônimo
Authentication → Providers → **Anonymous** ativo.

## 3. Como o app usa
- Salva/lê **sempre** a linha `id = main` → tablet e celular iguais
- Espelha no `localStorage` do aparelho
- Se a tabela não existir, o app mostra o botão **Copiar SQL**

## 4. Conferir no Dashboard
Table Editor → `treino_sync` → deve haver 1 linha após o primeiro save.
