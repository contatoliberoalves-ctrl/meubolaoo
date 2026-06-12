# Bolão do Prof. Líbero Filho · Copa 2026

Bolão gamificado da Copa do Mundo 2026 (@liberofilho). Stack: **Next.js 14
(App Router) + TypeScript + Tailwind**, **Supabase** (Postgres + Auth + RLS +
Realtime) e **Prisma**. Deploy em **Vercel** (front/SSR) + **Supabase** (db/auth).

## Funcionalidades

- **Landing** com figurinha-mascote do professor e modal de login/cadastro.
- **Jogos**: 72 partidas da fase de grupos (12 grupos × 6 jogos), filtro por
  grupo e rodada, palpite de placar exato, trava automática 5 min antes do jogo,
  exibição de pontuação (+5 exato / +2 resultado / 0 errou) e seção de mata-mata.
- **Ranking** ao vivo (Realtime) — Geral / Vencedores da semana / Melhor sequência.
- **Prêmios** — 4 conquistas premiadas + catálogo de 7 prêmios.
- **Conquistas** — sequência atual + 8 medalhas.
- **Admin** (role `admin`) — lançamento de resultados, trava de jogos e prêmios.

## Pontuação

- Placar exato = **5 pts**
- Acertou só o resultado (V/E/D) = **2 pts**
- Errou = **0**

## 1. Projeto Supabase (compartilhado)

Este Bolão roda no **mesmo projeto Supabase** (`qijziqjpvtjwarkodzxp`) que já
hospeda outra plataforma do professor. Para não colidir com as tabelas
existentes (`profiles`, `badges`, etc.), **todas as tabelas do Bolão usam o
prefixo `bolao_`** (`bolao_profiles`, `bolao_groups`, `bolao_teams`,
`bolao_matches`, `bolao_predictions`, `bolao_prizes_config`, `bolao_badges`,
`bolao_user_badges`), e a função helper de RLS chama-se `bolao_is_admin()`
(em vez de `is_admin()`). O schema, RLS e o seed (12 grupos, 48 seleções,
72 jogos da fase de grupos, 29 placeholders de mata-mata, 8 badges, 4 prêmios)
já foram aplicados diretamente nesse projeto.

Se for criar um projeto Supabase **próprio/novo** no futuro, basta:
1. Acesse <https://supabase.com> → **New project**. Guarde a senha do banco.
2. Em **Project Settings → API**, copie `Project URL`, `anon public key` e
   `service_role key`.
3. Em **Project Settings → Database → Connection string**, copie a string
   _pooled_ (porta 6543) para `DATABASE_URL` e a _direct_ (5432) para `DIRECT_URL`.
4. (Opcional) Em **Authentication → Providers → Email**, desative "Confirm email"
   para login imediato no cadastro durante os testes.

## 2. Configurar variáveis de ambiente

Copie `.env.example` para `.env` e preencha os valores. O `NEXT_PUBLIC_SUPABASE_URL`
e o `NEXT_PUBLIC_SUPABASE_ANON_KEY` do projeto compartilhado já estão
documentados em `.env` (gitignored); falta apenas:
- `SUPABASE_SERVICE_ROLE_KEY` — em **Project Settings → API → service_role**.
- `DATABASE_URL` / `DIRECT_URL` — em **Project Settings → Database → Connection
  string**, usando a senha do banco do projeto `qijziqjpvtjwarkodzxp`.

```bash
cp .env.example .env
```

## 3. Banco de dados (migrations + seed + RLS)

> No projeto compartilhado isso **já foi aplicado** (schema `bolao_*`, RLS e
> seed). Os passos abaixo servem para recriar em outro projeto ou após
> alterações no `schema.prisma`.

```bash
npm install
npx prisma generate

# Cria/atualiza as tabelas bolao_* no Supabase a partir do schema
npx prisma migrate dev --name init      # (ou `npx prisma db push`)

# Popula grupos, 72 jogos, badges e prizes_config
npx prisma db seed

# Aplica RLS + helper bolao_is_admin() — cole o conteúdo no SQL editor do Supabase
#   prisma/sql/rls.sql
```

> O arquivo `prisma/sql/rls.sql` deve ser executado **no SQL editor do
> Supabase** após as migrations. Ele ativa Row Level Security em todas as
> tabelas `bolao_*` e cria a função `bolao_is_admin()`. As mutações de admin no
> servidor usam a service-role key e contornam o RLS; as políticas protegem o
> acesso direto (anon/auth).

### Realtime

No painel do Supabase, em **Database → Replication**, habilite Realtime para as
tabelas `bolao_predictions` e `bolao_matches` (o ranking e os jogos atualizam
ao vivo). No projeto compartilhado isso já foi habilitado via migration.

## 4. Promover um usuário a admin

Após o cadastro do usuário, no **SQL editor** do Supabase:

```sql
update public.bolao_profiles
set role = 'admin'
where id = (
  select id from auth.users where email = 'contatoliberoalves@gmail.com'
);
```

## 5. Deploy na Vercel

1. Faça push do repositório para o GitHub.
2. Em <https://vercel.com> → **New Project** → importe o repositório.
3. Em **Settings → Environment Variables**, adicione todas as variáveis do
   `.env` (incluindo `CRON_SECRET`).
4. Deploy. O `vercel.json` já configura o cron `/api/cron/lock-matches`
   (a cada hora, limite do plano Hobby) que marca como `locked` os jogos com
   kickoff em menos de 5 minutos. O bloqueio real do palpite é sempre
   validado no servidor com base em `kickoff_at` (ver `isPredictable`), então
   a frequência do cron afeta só o indicador visual 🔒.

> O `build` roda `prisma generate` antes do `next build`. Todas as páginas/rotas
> que tocam o banco usam `export const dynamic = "force-dynamic"`, então o build
> **não** acessa o banco.

## Estrutura

```
prisma/
  schema.prisma     # modelo de dados
  seed.ts           # seed (72 jogos, badges, prizes_config, mata-mata)
  sql/rls.sql       # RLS + bolao_is_admin()
src/
  app/              # rotas (landing, /app/*, /api/*)
  components/       # Mascot, Figurinha, MatchCard, AuthModal, shells, etc.
  lib/              # prisma, supabase, auth, scoring, ranking, data (constantes)
```

## Notas de implementação

- **Mascote/Figurinha**: SVG cartoon próprio (rosto, óculos, blazer navy,
  gravata xadrez roxo/teal), com folha foil. Criatividade nos paths conforme
  permitido no spec.
- **Catálogo de prêmios**: os 7 itens vivem em `src/lib/data.ts`; apenas o
  mapeamento `slot → prize_label` das 4 conquistas é persistido em
  `prizes_config`.
- **Mata-mata**: o seed cria linhas placeholder (16 oitavas, 8 quartas, 4 semis,
  1 final) com times nulos e datas de referência (final em 19/07/2026). A UI
  mostra "a definir" enquanto não houver seleções. O admin atribui seleções via
  `/api/admin/knockout`.
- **Trava de palpites (regra crítica)** validada no servidor em
  `/api/predictions`: jogo não é palpitável se `locked`, se já tem resultado, ou
  se faltam menos de 5 minutos para o kickoff (`src/lib/data.ts → isPredictable`).
- **Pontuação atômica**: `/api/admin/result` recalcula `points` de todos os
  palpites do jogo dentro de um `prisma.$transaction` e dispara o recálculo de
  badges dos usuários afetados (`src/lib/scoring.ts`).
- **Badges**: 0 (Primeiro Palpite), 1 (Na Mosca), 2 (Pé Quente) e 3 (Vidente)
  são computadas automaticamente; 4–7 ficam para evolução manual/futura, mas o
  schema (`user_badges`) já as suporta.
- **Ranking semanal**: definido pragmaticamente como jogos com `kickoff_at` em
  `[agora-7d, agora]`. Sequência = maior corrida de palpites consecutivos
  (ordem por kickoff) com `points >= 2`.
- **Cadastro**: feito via `/api/auth/signup` (Supabase `signUp` + insert em
  `profiles`), em vez de trigger de banco, para simplicidade.
- **Jogos de abertura** (México×África do Sul e Coreia do Sul×Tchéquia, MD1 do
  Grupo A) são semeados em 11/06/2026 e `locked = true`, aparecendo fechados.
```
