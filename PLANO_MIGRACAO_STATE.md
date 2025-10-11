# Plano de Migração: Estado do Jogo - P2P para Servidor Centralizado

## Contexto

Atualmente o jogo usa um sistema **peer-to-peer** onde:
- O host mantém o estado autoritativo do jogo
- As ações dos jogadores são enviadas via WebSocket (broadcast) diretamente para todos
- O host salva o estado completo (JSON) no banco periodicamente
- Quando o host desconecta, há problemas de sincronização

**Objetivo**: Migrar para um sistema centralizado onde:
- Todas as ações vão para o banco de dados (source of truth)
- O banco dispara eventos WebSocket via Supabase Realtime
- Todos os jogadores recebem as atualizações do banco (não de outros jogadores)

---

## Análise do Estado Atual

### Estrutura do GameState (JSON)
```typescript
type GameState = {
  players: GamePlayer[];           // Array com id, nome, pontos, isHost
  stage: GameStage;                 // "word_pick" | "fake" | "vote" | "blame" | "finishing"
  currentRound: WordRound | null;   // palavra atual + definições falsas
  roundHistory: WordRound[];        // histórico de rodadas
  votes: [string, string][];        // [userId, definitionId]
}
```

### Problemas Identificados

1. **Estado monolítico**: Todo o estado em um único JSON dificulta:
   - Atualizações atômicas
   - Controle de concorrência
   - Rollback de erros

2. **Broadcast direto P2P**: Usa `channel.send()` para:
   - `stage-change`
   - `set-word`
   - `new-fake`
   - `remove-fake`
   - `new-vote`
   - `remove-vote`
   - `checkout-round`
   - `restart-game`
   - `kick-player`

3. **Host salva periodicamente**: `GameContext.tsx` linha 81-92
   - Debounce de 500ms
   - Só o host salva
   - Pode perder dados se host desconectar

---

## Fase 1: Nova Estrutura do Banco de Dados

### 1.1 Criar Novas Tabelas

**Migração**: `20251011_normalize_game_state.ts`

```sql
-- Tabela de jogadores da partida
CREATE TABLE game_players (
  room_code VARCHAR(8) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  kicked_at TIMESTAMPTZ,
  
  PRIMARY KEY (room_code, user_id),
  FOREIGN KEY (room_code) REFERENCES game_sessions(room_code) ON DELETE CASCADE
);

CREATE INDEX idx_game_players_room ON game_players(room_code);

-- Tabela de rodadas
CREATE TABLE game_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code VARCHAR(8) NOT NULL,
  round_number INTEGER NOT NULL,
  word_id UUID NOT NULL,
  word_label VARCHAR(255) NOT NULL,
  word_definition TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  
  FOREIGN KEY (room_code) REFERENCES game_sessions(room_code) ON DELETE CASCADE,
  FOREIGN KEY (word_id) REFERENCES words(id),
  UNIQUE (room_code, round_number)
);

CREATE INDEX idx_game_rounds_room ON game_rounds(room_code);
CREATE INDEX idx_game_rounds_active ON game_rounds(room_code, finished_at) 
  WHERE finished_at IS NULL;

-- Tabela de definições falsas
CREATE TABLE game_fake_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL,
  author_user_id VARCHAR(36) NOT NULL,
  definition TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  FOREIGN KEY (round_id) REFERENCES game_rounds(id) ON DELETE CASCADE,
  UNIQUE (round_id, author_user_id)
);

CREATE INDEX idx_fake_defs_round ON game_fake_definitions(round_id);

-- Tabela de votos
CREATE TABLE game_votes (
  round_id UUID NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  definition_id UUID, -- NULL se votou na palavra real
  is_real_word BOOLEAN NOT NULL DEFAULT FALSE,
  voted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  PRIMARY KEY (round_id, user_id),
  FOREIGN KEY (round_id) REFERENCES game_rounds(id) ON DELETE CASCADE
);

CREATE INDEX idx_game_votes_round ON game_votes(round_id);

-- Atualizar tabela game_sessions (remover game_state JSON)
ALTER TABLE game_sessions 
  ADD COLUMN stage VARCHAR(20) NOT NULL DEFAULT 'word_pick',
  ADD COLUMN current_round_id UUID,
  ADD CONSTRAINT fk_current_round 
    FOREIGN KEY (current_round_id) REFERENCES game_rounds(id);

CREATE INDEX idx_game_sessions_current_round ON game_sessions(current_round_id);
```

### 1.2 Migração de Dados Existentes

Criar script para migrar dados do JSON para as novas tabelas:

```typescript
// migrations/20251011_migrate_existing_state.ts
export async function up(db: Kysely<Database>): Promise<void> {
  // Buscar todas as sessões ativas
  const sessions = await db
    .selectFrom('game_sessions')
    .selectAll()
    .execute();
  
  for (const session of sessions) {
    const state = session.game_state as GameState;
    
    // 1. Migrar players
    if (state.players?.length) {
      await db.insertInto('game_players')
        .values(state.players.map(p => ({
          room_code: session.room_code,
          user_id: p.id,
          user_name: p.name,
          points: p.points || 0,
        })))
        .onConflict(oc => oc.doNothing())
        .execute();
    }
    
    // 2. Migrar round history
    if (state.roundHistory?.length) {
      for (let i = 0; i < state.roundHistory.length; i++) {
        const round = state.roundHistory[i];
        const [insertedRound] = await db.insertInto('game_rounds')
          .values({
            room_code: session.room_code,
            round_number: i + 1,
            word_id: round.word.id,
            word_label: round.word.label,
            word_definition: round.word.definition,
            finished_at: new Date(),
          })
          .returning('id')
          .execute();
        
        // Migrar fakes dessa rodada
        if (round.fakes?.length) {
          await db.insertInto('game_fake_definitions')
            .values(round.fakes.map(f => ({
              round_id: insertedRound.id,
              author_user_id: f.author.id,
              definition: f.definition,
            })))
            .execute();
        }
      }
    }
    
    // 3. Migrar currentRound
    if (state.currentRound) {
      const [currentRound] = await db.insertInto('game_rounds')
        .values({
          room_code: session.room_code,
          round_number: (state.roundHistory?.length || 0) + 1,
          word_id: state.currentRound.word.id,
          word_label: state.currentRound.word.label,
          word_definition: state.currentRound.word.definition,
          finished_at: null, // Rodada ativa
        })
        .returning('id')
        .execute();
      
      // Migrar fakes da rodada atual
      if (state.currentRound.fakes?.length) {
        await db.insertInto('game_fake_definitions')
          .values(state.currentRound.fakes.map(f => ({
            round_id: currentRound.id,
            author_user_id: f.author.id,
            definition: f.definition,
          })))
          .execute();
      }
      
      // Migrar votos da rodada atual
      if (state.votes?.length) {
        await db.insertInto('game_votes')
          .values(state.votes.map(([userId, defId]) => ({
            round_id: currentRound.id,
            user_id: userId,
            definition_id: defId === state.currentRound!.word.id ? null : defId,
            is_real_word: defId === state.currentRound!.word.id,
          })))
          .execute();
      }
      
      // Atualizar referência
      await db.updateTable('game_sessions')
        .set({ current_round_id: currentRound.id })
        .where('room_code', '=', session.room_code)
        .execute();
    }
    
    // 4. Atualizar stage
    if (state.stage) {
      await db.updateTable('game_sessions')
        .set({ stage: state.stage })
        .where('room_code', '=', session.room_code)
        .execute();
    }
  }
}
```

### 1.3 Habilitar Row Level Security (RLS)

```sql
-- Habilitar RLS
ALTER TABLE game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_fake_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_votes ENABLE ROW LEVEL SECURITY;

-- Políticas: todos podem ler
CREATE POLICY "Anyone can read game players" ON game_players FOR SELECT USING (true);
CREATE POLICY "Anyone can read game rounds" ON game_rounds FOR SELECT USING (true);
CREATE POLICY "Anyone can read fake definitions" ON game_fake_definitions FOR SELECT USING (true);
CREATE POLICY "Anyone can read votes" ON game_votes FOR SELECT USING (true);

-- Políticas: apenas inserção via service role (backend)
-- Nota: No Supabase, você pode criar uma função com SECURITY DEFINER
```

---

## Fase 2: Criar Server Actions para Modificar Estado

### 2.1 Estrutura de Server Actions

Criar actions atômicas que substituem os dispatchers P2P:

```typescript
// src/server/actions/game/
├── changeStage.ts
├── setWordAndStartFake.ts
├── addFakeDefinition.ts
├── removeFakeDefinition.ts
├── addVote.ts
├── removeVote.ts
├── checkoutRound.ts
├── restartGame.ts
├── kickPlayer.ts
└── index.ts
```

### 2.2 Exemplo de Action

```typescript
// src/server/actions/game/addFakeDefinition.ts
"use server";

import { db } from "@/infra/db";
import { v4 } from "uuid";

export async function addFakeDefinition({
  roomCode,
  userId,
  definition,
}: {
  roomCode: string;
  userId: string;
  definition: string;
}) {
  // 1. Buscar rodada atual
  const session = await db
    .selectFrom('game_sessions')
    .where('room_code', '=', roomCode)
    .select('current_round_id')
    .executeTakeFirst();
  
  if (!session?.current_round_id) {
    throw new Error('Nenhuma rodada ativa');
  }
  
  // 2. Inserir definição falsa
  await db
    .insertInto('game_fake_definitions')
    .values({
      id: v4(),
      round_id: session.current_round_id,
      author_user_id: userId,
      definition,
    })
    .onConflict(oc => oc
      .columns(['round_id', 'author_user_id'])
      .doUpdateSet({ definition })
    )
    .execute();
  
  // 3. Verificar se todos enviaram
  const [players, fakes] = await Promise.all([
    db.selectFrom('game_players')
      .where('room_code', '=', roomCode)
      .where('kicked_at', 'is', null)
      .select(db.fn.countAll().as('count'))
      .executeTakeFirst(),
    db.selectFrom('game_fake_definitions')
      .where('round_id', '=', session.current_round_id)
      .select(db.fn.countAll().as('count'))
      .executeTakeFirst(),
  ]);
  
  // 4. Se todos enviaram, avançar para votação
  if (players?.count === fakes?.count) {
    await db
      .updateTable('game_sessions')
      .set({ stage: 'vote' })
      .where('room_code', '=', roomCode)
      .execute();
  }
  
  return { success: true };
}
```

### 2.3 Actions Necessárias

1. **changeStage**: Muda o estágio do jogo
2. **setWordAndStartFake**: Define palavra e inicia fase de falsas
3. **addFakeDefinition**: Adiciona definição falsa (auto-avança para vote)
4. **removeFakeDefinition**: Remove definição falsa do usuário
5. **addVote**: Registra voto (auto-avança para blame)
6. **removeVote**: Remove voto do usuário
7. **checkoutRound**: Finaliza rodada, calcula pontos, inicia nova
8. **restartGame**: Reseta jogo
9. **kickPlayer**: Remove jogador
10. **joinGame**: Adiciona jogador à partida

---

## Fase 3: Criar Repositories e Services

### 3.1 Repositories

```typescript
// src/server/repositories/gamePlayer/
├── create.ts         // Adicionar jogador
├── get.ts            // Buscar jogadores
├── updatePoints.ts   // Atualizar pontos
├── kick.ts           // Marcar como removido
├── reset.ts          // Resetar pontos
└── index.ts

// src/server/repositories/gameRound/
├── create.ts         // Criar rodada
├── getCurrent.ts     // Buscar rodada atual
├── getHistory.ts     // Buscar histórico
├── finish.ts         // Finalizar rodada
└── index.ts

// src/server/repositories/gameFakeDefinition/
├── create.ts
├── remove.ts
├── getByRound.ts
└── index.ts

// src/server/repositories/gameVote/
├── create.ts
├── remove.ts
├── getByRound.ts
└── index.ts
```

### 3.2 Exemplo de Repository

```typescript
// src/server/repositories/gameRound/getCurrent.ts
import { db } from "@/infra/db";

export async function getCurrent(roomCode: string) {
  const session = await db
    .selectFrom('game_sessions')
    .where('room_code', '=', roomCode)
    .select('current_round_id')
    .executeTakeFirst();
  
  if (!session?.current_round_id) {
    return null;
  }
  
  const round = await db
    .selectFrom('game_rounds')
    .where('id', '=', session.current_round_id)
    .selectAll()
    .executeTakeFirst();
  
  return round;
}
```

---

## Fase 4: Atualizar WebSocket para Postgres Changes

### 4.1 Configurar Supabase Realtime

No Supabase Dashboard:
1. Habilitar Realtime para as novas tabelas
2. Configurar publicação de mudanças

### 4.2 Atualizar RoomContext

```typescript
// src/lib/contexts/RoomContext.tsx

// ADICIONAR: Listeners para postgres_changes
useEffect(() => {
  if (!channel) return;
  
  // Listen para mudanças na sessão (stage)
  channel
    .on('postgres_changes', {
      schema: 'public',
      event: 'UPDATE',
      table: 'game_sessions',
      filter: `room_code=eq.${room.code}`
    }, (payload) => {
      // Atualizar stage local
      setStage(payload.new.stage);
    })
    
    // Listen para mudanças nos jogadores
    .on('postgres_changes', {
      schema: 'public',
      event: '*',
      table: 'game_players',
      filter: `room_code=eq.${room.code}`
    }, async () => {
      // Re-fetch jogadores
      await refetchPlayers();
    })
    
    // Listen para mudanças na rodada atual
    .on('postgres_changes', {
      schema: 'public',
      event: '*',
      table: 'game_rounds',
      filter: `room_code=eq.${room.code}`
    }, async () => {
      await refetchCurrentRound();
    })
    
    // Listen para definições falsas
    .on('postgres_changes', {
      schema: 'public',
      event: '*',
      table: 'game_fake_definitions'
    }, async (payload) => {
      // Verificar se é da rodada atual
      await refetchFakeDefinitions();
    })
    
    // Listen para votos
    .on('postgres_changes', {
      schema: 'public',
      event: '*',
      table: 'game_votes'
    }, async () => {
      await refetchVotes();
    });
    
}, [channel, room.code]);
```

### 4.3 Criar Hooks de Sincronização

```typescript
// src/lib/hooks/useGameSync.ts
export function useGameSync(roomCode: string) {
  const [stage, setStage] = useState<GameStage>('word_pick');
  const [players, setPlayers] = useState<GamePlayer[]>([]);
  const [currentRound, setCurrentRound] = useState<WordRound | null>(null);
  const [votes, setVotes] = useState<Map<string, string>>(new Map());
  
  const refetchAll = useCallback(async () => {
    const [sessionData, playersData, roundData, votesData] = await Promise.all([
      gameSessionService.get(roomCode),
      gamePlayerService.getAll(roomCode),
      gameRoundService.getCurrent(roomCode),
      gameVoteService.getCurrent(roomCode),
    ]);
    
    setStage(sessionData?.stage || 'word_pick');
    setPlayers(playersData);
    setCurrentRound(roundData);
    setVotes(new Map(votesData));
  }, [roomCode]);
  
  // Fetch inicial
  useEffect(() => {
    refetchAll();
  }, [refetchAll]);
  
  return {
    stage,
    players,
    currentRound,
    votes,
    refetchAll,
    // ... métodos individuais de refetch
  };
}
```

---

## Fase 5: Atualizar Componentes

### 5.1 Remover useDispatcher

**ANTES:**
```typescript
const addFakeWord = useDispatcher<string>({
  event: 'new-fake',
  apply: pushFakeWord,
});
```

**DEPOIS:**
```typescript
const addFakeWord = async (definition: string) => {
  await gameActions.addFakeDefinition({
    roomCode: code,
    userId: user.id,
    definition,
  });
};
```

### 5.2 Atualizar GameContext

```typescript
// src/lib/contexts/GameContext.tsx

// REMOVER:
// - Todo o sistema de dispatchers
// - useGameController
// - Lógica de broadcast

// ADICIONAR:
// - Chamadas diretas para server actions
// - useGameSync para receber atualizações

const GameContext = createContext<GameContextValue>({} as GameContextValue);

function GameProvider({ children, configs }: Props) {
  const { user } = useSession();
  const { code } = useRoomChannel();
  const { stage, players, currentRound, votes, refetchAll } = useGameSync(code);
  
  const actions = {
    setWordAndStartFakeStage: async (word: SimpleWord) => {
      await gameActions.setWordAndStartFake({ roomCode: code, word });
    },
    
    addFakeWord: async (definition: string) => {
      await gameActions.addFakeDefinition({
        roomCode: code,
        userId: user.id,
        definition,
      });
    },
    
    vote: async (definitionId: string) => {
      await gameActions.addVote({
        roomCode: code,
        userId: user.id,
        definitionId,
      });
    },
    
    // ... outras actions
  };
  
  return (
    <GameContext.Provider value={{ stage, players, votes, currentRound, actions }}>
      {children}
    </GameContext.Provider>
  );
}
```

### 5.3 Componentes a Atualizar

- `src/lib/components/modules/InGame/Stages/FakeStage.tsx`
- `src/lib/components/modules/InGame/Stages/VoteStage.tsx`
- `src/lib/components/modules/InGame/Stages/BlameStage.tsx`
- `src/lib/components/modules/InGame/Stages/WordSelector.tsx`
- `src/lib/components/modules/InGame/Stages/FinishStage.tsx`
- `src/lib/components/modules/Host/HostControlButton.tsx`
- `src/lib/components/modules/Host/KickPlayers.tsx`

---

## Fase 6: Testes e Validação

### 6.1 Testes de Integração

1. **Teste de Fluxo Completo**
   - Criar sala
   - 3+ jogadores entram
   - Jogar rodada completa
   - Verificar pontos
   - Host desconecta
   - Verificar que jogo continua

2. **Teste de Concorrência**
   - Múltiplos jogadores votam simultaneamente
   - Verificar que todos os votos são registrados

3. **Teste de Reconexão**
   - Jogador desconecta
   - Reconecta
   - Verifica que estado está sincronizado

### 6.2 Monitoramento

Adicionar logs para:
- Tempo de resposta das actions
- Número de eventos WebSocket
- Erros de sincronização

---

## Fase 7: Limpeza e Deprecação

### 7.1 Remover Código Antigo

1. **Remover:**
   - `src/lib/hooks/useDispatcher.ts`
   - `src/lib/hooks/useGameController.ts`
   - `src/lib/hooks/useGameStage.ts`
   - `src/lib/hooks/useGameRound.ts`
   - `src/lib/hooks/useGamePlayers.ts`
   - Lógica de broadcast em `GameContext.tsx`

2. **Remover coluna:**
   ```sql
   ALTER TABLE game_sessions DROP COLUMN game_state;
   ```

### 7.2 Atualizar Documentação

- README com nova arquitetura
- Diagrama de fluxo de dados
- Guia de desenvolvimento

---

## Cronograma Estimado

| Fase | Tarefa | Estimativa | Dependências |
|------|--------|------------|--------------|
| 1 | Criar migração DB | 4h | - |
| 1 | Script de migração de dados | 3h | Migração DB |
| 1 | Configurar RLS | 2h | Migração DB |
| 2 | Criar repositories | 6h | Migração DB |
| 2 | Criar server actions | 8h | Repositories |
| 3 | Criar services de fetch | 4h | Repositories |
| 4 | Atualizar WebSocket listeners | 6h | Services |
| 4 | Criar useGameSync | 4h | Services |
| 5 | Atualizar GameContext | 4h | useGameSync |
| 5 | Atualizar componentes | 8h | GameContext |
| 6 | Testes manuais | 4h | Componentes |
| 6 | Testes de concorrência | 3h | Componentes |
| 7 | Remover código antigo | 2h | Testes OK |
| 7 | Documentação | 2h | - |

**Total estimado: ~60 horas** (1,5 semanas de trabalho full-time)

---

## Riscos e Mitigações

### Riscos

1. **Perda de dados durante migração**
   - Mitigação: Backup completo antes da migração
   - Rollback plan: Manter coluna `game_state` temporariamente

2. **Performance de WebSocket**
   - Mitigação: Usar índices apropriados
   - Monitorar número de eventos
   - Implementar debounce se necessário

3. **Mudanças simultâneas conflitantes**
   - Mitigação: Usar constraints UNIQUE apropriadas
   - Implementar retry logic nas actions

4. **Supabase Realtime limits**
   - Mitigação: Verificar limites do plano
   - Considerar batching de eventos se necessário

### Rollback Strategy

Se houver problemas graves:
1. Reverter migrations
2. Reativar código P2P antigo (via feature flag)
3. Restaurar backup do banco
4. Investigar e corrigir antes de nova tentativa

---

## Próximos Passos

1. **Validar plano com time**
2. **Criar branch `feat/centralized-state`**
3. **Implementar Fase 1** (migrations)
4. **Testar migração em ambiente de dev**
5. **Continuar fases sequencialmente**

---

## Notas Técnicas

### Vantagens da Nova Abordagem

✅ **Atomicidade**: Cada ação é uma transação isolada
✅ **Consistência**: Banco é source of truth
✅ **Não depende do host**: Qualquer jogador pode desconectar
✅ **Auditoria**: Histórico completo no banco
✅ **Escalabilidade**: Preparado para múltiplas salas simultâneas
✅ **Debug**: Logs e estado visíveis no banco

### Desafios

⚠️ **Latência**: Chamadas ao banco podem ser mais lentas que P2P
⚠️ **Complexidade**: Mais código para manter
⚠️ **Custo**: Mais operações no Supabase

### Otimizações Futuras

- Implementar cache com Redis
- Websocket direto (não Supabase) para baixa latência
- Batch updates para reduzir chamadas
- Server-side rendering do estado
