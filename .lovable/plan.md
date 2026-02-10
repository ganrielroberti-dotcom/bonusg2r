

# Plano de Integracao Auvo API V2

## 1. Analise da API Auvo - Endpoints e Campos Identificados

### 1.1 Autenticacao
- **Endpoint**: `POST /login/` ou `GET /login/?apiKey={apiKey}&apiToken={apiToken}`
- **Campos**: `apiKey`, `apiToken` (no body ou query)
- **Resposta**: `accessToken` (expira em 30 minutos)
- **Header obrigatorio**: `Authorization: Bearer {accessToken}`
- **Rate Limit**: 400 requests/minuto por IP

### 1.2 Buscar OS (Tasks)
- **Listar**: `GET /tasks/?paramFilter={json}&page={p}&pageSize={ps}&order={o}`
- **Individual**: `GET /tasks/{id}`
- **Filtros disponiveis**: `taskID`, `startDate`, `endDate`, `idUserTo`, `customerId`, `status`, `externalId`
- **Campos relevantes da resposta**:
  - `taskID` (number) - ID interno da task
  - `externalId` (string) - ID externo
  - `customerDescription` (string) - Nome do cliente
  - `customerId` (number) - ID do cliente
  - `taskDate` (string) - Data agendada
  - `taskType` (number) - ID do tipo
  - `taskTypeDescription` (string) - Descricao do tipo
  - `idUserTo` (number) - ID do tecnico responsavel
  - `userToName` (string) - Nome do tecnico
  - `checkInDate` (string) - Timestamp check-in
  - `checkOutDate` (string) - Timestamp check-out
  - `taskStatus` (number): 1=Opened, 2=InDisplacement, 3=CheckedIn, 4=CheckedOut, 5=Finished, 6=Paused
  - `duration` (string) - Duracao computada
  - `durationDecimal` (string) - Duracao em decimal

### 1.3 Usuarios (Tecnicos)
- **Listar**: `GET /users/?paramFilter={json}&page={p}&pageSize={ps}&order={o}`
- **Individual**: `GET /users/{id}`
- **Campos**: `userId`, `name`, `email`, `jobPosition`, `externalId`

### 1.4 Clientes
- **Individual**: `GET /customers/{id}`
- **Campos**: `id`, `description` (nome), `cpfCnpj`, `address`

### 1.5 Tipos de Tarefa
- **Listar**: `GET /taskTypes/?paramFilter={json}&page={p}&pageSize={ps}&order={o}`
- **Campos**: `id`, `description`

### 1.6 Limitacao Critica: Calculo de Horas
A API Auvo V2 **NAO expoe um historico de eventos de pausa/retomada**. Os dados disponiveis por task sao:
- `checkInDate` - quando fez check-in
- `checkOutDate` - quando fez check-out (vazio se nao fez)
- `taskStatus` - estado atual (3=CheckedIn, 6=Paused)
- `duration` / `durationDecimal` - duracao (possivelmente computada pelo Auvo apos checkout)

**Estrategia para calculo de horas:**
- Tasks com checkout (status 4/5): usar `checkOutDate - checkInDate` como tempo bruto, ou o campo `durationDecimal` se disponivel (pois o Auvo ja desconta pausas internamente)
- Tasks em andamento (status 3 - CheckedIn): contar de `checkInDate` ate `min(now, monthEnd)`
- Tasks pausadas (status 6): usar `duration`/`durationDecimal` se disponivel; caso contrario usar `checkInDate` como inicio e considerar como tempo parcial
- Corte mensal: cada intervalo clippado na janela `[monthStart, monthEnd)`

---

## 2. Arquitetura da Solucao

### 2.1 Backend (Edge Functions)

Serao criadas 3 edge functions:

1. **`auvo-proxy`** - Proxy centralizado para a API Auvo
   - Gerencia autenticacao (login + cache do token por 25 min)
   - Faz as chamadas reais a API Auvo
   - Trata rate limiting com retry/backoff
   - Endpoints internos:
     - `POST /search-task` - busca task por numero/externalId
     - `POST /list-tasks` - lista tasks por periodo/usuario
     - `POST /list-users` - lista usuarios do Auvo

2. **`auvo-hours-sync`** - Sincronizacao de horas
   - Busca todas tasks de um mes para todos tecnicos
   - Calcula horas em atividade por colaborador
   - Faz upsert na tabela `horas_trabalhadas`
   - Registra log de execucao
   - Chamado pelo cron (4x/dia) e pelo botao "Atualizar agora"

3. **`auvo-cron-trigger`** - Trigger para o cron job (pg_cron)
   - Chama `auvo-hours-sync` para mes atual e anterior

### 2.2 Novas Tabelas no Banco

```text
auvo_config
+-----------+------+----------------------------------+
| Campo     | Tipo | Descricao                        |
+-----------+------+----------------------------------+
| id        | uuid | PK                               |
| api_key   | text | Auvo API Key (criptografada)     |
| api_token | text | Auvo API Token (criptografada)   |
| enabled   | bool | Integracao ativa                 |
| updated_at| tstz | Ultima atualizacao               |
+-----------+------+----------------------------------+

auvo_user_mapping
+-----------------+------+----------------------------------+
| Campo           | Tipo | Descricao                        |
+-----------------+------+----------------------------------+
| id              | uuid | PK                               |
| auvo_user_id    | int  | userId no Auvo                   |
| auvo_user_name  | text | Nome no Auvo                     |
| employee_id     | uuid | FK -> employees.id               |
| created_at      | tstz | Criacao                          |
+-----------------+------+----------------------------------+

auvo_sync_log
+-----------------+------+----------------------------------+
| Campo           | Tipo | Descricao                        |
+-----------------+------+----------------------------------+
| id              | uuid | PK                               |
| month_key       | text | YYYY-MM                          |
| started_at      | tstz | Inicio da sincronizacao          |
| finished_at     | tstz | Fim                              |
| employees_count | int  | Colaboradores atualizados        |
| tasks_count     | int  | Tasks processadas                |
| errors          | jsonb| Erros por colaborador            |
| status          | text | success/partial/error            |
+-----------------+------+----------------------------------+

auvo_hours_cache
+-----------------+------+----------------------------------+
| Campo           | Tipo | Descricao                        |
+-----------------+------+----------------------------------+
| id              | uuid | PK                               |
| month_key       | text | YYYY-MM                          |
| employee_id     | uuid | FK -> employees.id               |
| auvo_user_id    | int  | userId no Auvo                   |
| total_hours     | num  | Total de horas calculadas        |
| tasks_detail    | jsonb| Detalhamento por task            |
| synced_at       | tstz | Ultima sincronizacao             |
+-----------------+------+----------------------------------+

auvo_task_cache
+-----------------+------+----------------------------------+
| Campo           | Tipo | Descricao                        |
+-----------------+------+----------------------------------+
| id              | uuid | PK                               |
| auvo_task_id    | int  | taskID no Auvo                   |
| os_number       | text | Numero/externalId da OS          |
| data            | jsonb| Payload completo da task         |
| cached_at       | tstz | Quando foi cacheada              |
+-----------------+------+----------------------------------+
```

Todas tabelas com RLS: somente gestores podem ler/escrever.

### 2.3 Frontend - Novos Componentes

**Integracao 1 - Auto-preenchimento da OS:**
- Componente `AuvoOSLookup` embutido no `OSForm.tsx`
- Ao digitar numero e pressionar Enter/blur, chama edge function
- Modal de confirmacao: "OS encontrada no Auvo. Deseja puxar os dados?"
- Preenche: Numero, Cliente, Data, Tipo, Tecnico (seleciona automaticamente)
- Cache local: evita bater na API para o mesmo numero em 24h

**Integracao 2 - Tela de Relatorio de Horas:**
- Nova rota `/horas-auvo` ou dialog/tab na aba Colaboradores
- Seletor de mes/ano + filtro de colaborador
- Tabela com: Colaborador | Horas Calculadas | Ultima Sync | Status
- Botao "Sincronizar Agora"
- Auto-refresh a cada 15 min quando tela aberta
- Botao para aplicar horas (upsert em `horas_trabalhadas`)

**Configuracao Auvo:**
- Na aba Config, novo bloco "Integracao Auvo"
- Campos: API Key, API Token, toggle ativo/inativo
- Tela de mapeamento de usuarios Auvo <-> Colaboradores do app

---

## 3. Regra de Calculo de Horas - Exemplos

**Formula por task:**
```text
Para cada task do colaborador no mes:
  Se tem checkInDate:
    ini = max(checkInDate, monthStart)
    
    Se tem checkOutDate:
      fim = min(checkOutDate, monthEnd)
    Senao se taskStatus == 3 (CheckedIn, trabalhando):
      fim = min(now(), monthEnd)
    Senao se taskStatus == 6 (Paused):
      Se durationDecimal disponivel:
        usar durationDecimal diretamente
      Senao:
        fim = ini (0 horas - conservador)
    
    horas_task = max(0, fim - ini) em horas

  total_mes = soma de horas_task para todas tasks
```

**Exemplo 1 - OS Normal:**
- CheckIn: 2026-02-05 08:00, CheckOut: 2026-02-05 14:30
- Horas = 6.5h

**Exemplo 2 - OS sem Checkout (em andamento):**
- CheckIn: 2026-02-10 09:00, Status: CheckedIn(3), Agora: 2026-02-10 15:00
- Horas = 6.0h (contando ate "agora")
- No fechamento do mes (se continuar aberta): Horas = checkIn ate 2026-03-01 00:00

**Exemplo 3 - OS que atravessa o mes:**
- CheckIn: 2026-01-29 14:00, CheckOut: 2026-02-03 10:00
- Para Janeiro: max(14:00 dia 29, Jan 01 00:00) ate min(10:00 dia 03, Fev 01 00:00) = 29/Jan 14:00 ate 01/Fev 00:00 = 58h
- Para Fevereiro: max(14:00 dia 29, Fev 01 00:00) ate min(10:00 dia 03, Mar 01 00:00) = 01/Fev 00:00 ate 03/Fev 10:00 = 58h

---

## 4. Configuracao de Credenciais

As credenciais do Auvo (`apiKey` e `apiToken`) serao armazenadas como secrets no backend (acessiveis via `Deno.env`). Nomes dos secrets:
- `AUVO_API_KEY`
- `AUVO_API_TOKEN`

---

## 5. Cron Job (Sincronizacao 4x/dia)

Sera configurado via `pg_cron` + `pg_net`:
- Executa a cada 6 horas (00:00, 06:00, 12:00, 18:00)
- Chama a edge function `auvo-hours-sync` para o mes atual e o mes anterior
- Registra resultado no `auvo_sync_log`

---

## 6. Arquivos a Criar/Alterar

### Novos Arquivos:
- `supabase/functions/auvo-proxy/index.ts` - Proxy para API Auvo
- `supabase/functions/auvo-hours-sync/index.ts` - Sincronizacao de horas
- `src/components/bonus/auvo/AuvoOSLookup.tsx` - Auto-preenchimento
- `src/components/bonus/auvo/AuvoHoursReport.tsx` - Relatorio de horas
- `src/components/bonus/auvo/AuvoConfigPanel.tsx` - Configuracao
- `src/components/bonus/auvo/AuvoUserMapping.tsx` - Mapeamento usuarios
- `src/hooks/useAuvoIntegration.ts` - Hook para chamadas ao Auvo
- `src/types/auvo.ts` - Tipos TypeScript

### Arquivos Alterados:
- `src/components/bonus/OSForm.tsx` - Adicionar botao/trigger de busca Auvo
- `src/components/bonus/config/GeneralConfig.tsx` ou novo tab - Painel Auvo
- `src/components/bonus/TabsNavigation.tsx` - Adicionar aba "Horas Auvo" (se aplicavel)
- `src/components/bonus/EmployeesTab.tsx` - Indicador visual de sync Auvo
- `src/App.tsx` - Rota para relatorio (se pagina separada)
- Migracoes SQL para novas tabelas + RLS + cron job

---

## 7. Sequencia de Implementacao

1. Solicitar as credenciais Auvo (`AUVO_API_KEY`, `AUVO_API_TOKEN`) como secrets
2. Criar tabelas no banco (migracao SQL com RLS)
3. Implementar edge function `auvo-proxy` (auth + busca de tasks + cache token)
4. Implementar Integracao 1: auto-preenchimento no `OSForm` com modal de confirmacao
5. Implementar edge function `auvo-hours-sync` (calculo de horas + upsert)
6. Implementar Integracao 2: tela de relatorio + mapeamento de usuarios
7. Configurar cron job via pg_cron
8. Adicionar testes do calculo de horas (Vitest)

