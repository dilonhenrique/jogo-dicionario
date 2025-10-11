# Guia de Uso das Server Actions

## Como usar as Server Actions criadas

### 1. Importar as actions

```typescript
import { gameActions } from "@/server/actions/game";
// ou importar individualmente
import { addFakeDefinition } from "@/server/actions/game/addFakeDefinition";
```

### 2. Exemplos de uso

#### Iniciar rodada com palavra escolhida

```typescript
const handleWordSelected = async (word: SimpleWord) => {
  try {
    const result = await gameActions.setWordAndStartFake({
      roomCode: code,
      word: { label: "cachorro", definition: "Animal de estimação..." }
    });
    
    // Stage automaticamente mudou para 'fake'
    // current_round_id foi atualizado
  } catch (error) {
    console.error("Erro ao iniciar rodada:", error);
  }
};
```

#### Adicionar definição falsa

```typescript
const handleSubmitFake = async (definition: string) => {
  try {
    await gameActions.addFakeDefinition({
      roomCode: code,
      userId: user.id,
      definition: "Minha definição falsa..."
    });
    
    // Se todos enviaram, o stage muda automaticamente para 'vote'
  } catch (error) {
    console.error("Erro ao enviar definição:", error);
  }
};
```

#### Votar em uma definição

```typescript
const handleVote = async (definitionId: string, isRealWord: boolean) => {
  try {
    await gameActions.addVote({
      roomCode: code,
      userId: user.id,
      definitionId: isRealWord ? null : definitionId,
      isRealWord
    });
    
    // Se todos votaram, o stage muda automaticamente para 'blame'
  } catch (error) {
    console.error("Erro ao votar:", error);
  }
};
```

#### Finalizar rodada e calcular pontos

```typescript
const handleNextRound = async () => {
  try {
    const result = await gameActions.checkoutRound({
      roomCode: code,
      configs: gameConfigs
    });
    
    if (result.finished) {
      // Jogo acabou (alguém atingiu pontuação máxima)
      // Stage está em 'finishing'
    } else {
      // Nova rodada iniciou ou aguarda escolha de palavra
    }
  } catch (error) {
    console.error("Erro ao finalizar rodada:", error);
  }
};
```

#### Reiniciar jogo

```typescript
const handleRestart = async () => {
  try {
    await gameActions.restartGame({
      roomCode: code,
      configs: gameConfigs
    });
    
    // Pontos resetados, nova rodada iniciou
  } catch (error) {
    console.error("Erro ao reiniciar:", error);
  }
};
```

#### Remover jogador

```typescript
const handleKick = async (playerId: string) => {
  try {
    await gameActions.kickPlayer({
      roomCode: code,
      userId: playerId
    });
  } catch (error) {
    console.error("Erro ao remover jogador:", error);
  }
};
```

#### Entrar no jogo

```typescript
const handleJoin = async () => {
  try {
    const result = await gameActions.joinGame({
      roomCode: code,
      userId: user.id,
      userName: user.name
    });
    
    if (result.alreadyJoined) {
      console.log("Jogador já estava na partida");
    }
  } catch (error) {
    console.error("Erro ao entrar no jogo:", error);
  }
};
```

---

## Fluxo Automático Implementado

### Durante Fase de Definições Falsas (`stage: 'fake'`)

```typescript
// Jogador 1 envia definição
await gameActions.addFakeDefinition({ ... });
// Ainda em 'fake'

// Jogador 2 envia definição
await gameActions.addFakeDefinition({ ... });
// Ainda em 'fake'

// Jogador 3 (último) envia definição
await gameActions.addFakeDefinition({ ... });
// ✨ AUTOMATICAMENTE muda para 'vote'
```

### Durante Fase de Votação (`stage: 'vote'`)

```typescript
// Jogador 1 vota
await gameActions.addVote({ ... });
// Ainda em 'vote'

// Jogador 2 vota
await gameActions.addVote({ ... });
// Ainda em 'vote'

// Jogador 3 (último) vota
await gameActions.addVote({ ... });
// ✨ AUTOMATICAMENTE muda para 'blame'
```

### Checkout de Rodada (`stage: 'blame'`)

```typescript
// Host clica para avançar
const result = await gameActions.checkoutRound({ ... });

if (configs.enableMaxPoints && alguemGanhou) {
  // ✨ AUTOMATICAMENTE vai para 'finishing'
} else if (configs.enableHostChooseWord) {
  // ✨ AUTOMATICAMENTE vai para 'word_pick'
} else {
  // ✨ AUTOMATICAMENTE escolhe palavra e vai para 'fake'
}
```

---

## Estado Sincronizado via WebSocket

Após implementar a Fase 4, todas as mudanças serão propagadas automaticamente:

```typescript
// Jogador A executa action
await gameActions.addVote({ ... });
         ↓
   Atualiza banco
         ↓
  Postgres Changes Event (Supabase Realtime)
         ↓
   Jogador B, C, D recebem atualização automaticamente
```

---

## Tratamento de Erros

Todas as actions podem lançar erros, sempre use try/catch:

```typescript
try {
  await gameActions.addFakeDefinition({ ... });
} catch (error) {
  if (error instanceof Error) {
    // Exibir mensagem amigável
    toast.error(error.message);
  }
}
```

Erros comuns:
- `"Nenhuma rodada ativa"`: Tentar votar/adicionar fake sem rodada criada
- `"Erro ao criar rodada"`: Problema ao criar rodada no banco
- Violação de constraints (ex: definição duplicada)

---

## Diferenças do Sistema Antigo

### ❌ Antes (P2P)
```typescript
const addFakeWord = useDispatcher<string>({
  event: 'new-fake',
  apply: pushFakeWord, // Atualiza estado local
});

// Chamada
addFakeWord(definition); // Broadcast via WebSocket
```

### ✅ Agora (Servidor Centralizado)
```typescript
const addFakeWord = async (definition: string) => {
  await gameActions.addFakeDefinition({
    roomCode: code,
    userId: user.id,
    definition,
  });
};

// Chamada (async/await)
await addFakeWord(definition); // Salva no banco → WS automático
```

---

## Vantagens

1. **Sem dependência do host**: Qualquer jogador pode desconectar
2. **Estado sempre consistente**: Banco é source of truth
3. **Auto-progressão**: Não precisa check manual se todos concluíram
4. **Auditoria**: Tudo registrado no banco
5. **Rollback fácil**: Pode desfazer ações via banco
6. **Escalável**: Funciona com N jogadores/salas

---

## Próximos Passos

Após implementar Fase 4 e 5, você poderá:

1. Remover todos os `useDispatcher`
2. Remover lógica de broadcast manual
3. Substituir por chamadas diretas às server actions
4. Receber atualizações via `postgres_changes` listeners
