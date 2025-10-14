# Plano de Implementação - Sistema de Avaliação de Palavras

Este é um plano feito por IA para implementar um sistema de avaliação de palavras para o jogo. Importante: a inteligência artificial que criou este plano não tinha o contexto da nossa aplicação, então é preciso adaptar alguns detalhes, como arquitetura, stack utilizada e nomenclatura de arquivos e variáveis. Todo código apresentado aqui é somente um exemplo e deve ser revisado.

## 📋 Visão Geral das Fases

1. **Fase 1:** Migrations (Kysely) - Estrutura de dados
2. **Fase 2:** Functions e Triggers (Supabase SQL Editor)
3. **Fase 3:** Backend/API (Next.js)
4. **Fase 4:** Frontend (UI de Feedback)
5. **Fase 5:** Script de Limpeza Inicial
6. **Fase 6:** Monitoramento e Ajustes

---

## 📝 CHECKLIST DE IMPLEMENTAÇÃO

### ✅ Fase 1: Migrations

- [ ] Criar migration com Kysely
- [ ] Rodar `npm run migrate:up`
- [ ] Verificar tabelas no Supabase Dashboard
- [ ] Confirmar que `word_metrics` foi criada
- [ ] Confirmar que `word_votes` foi alterada

### ✅ Fase 2: Functions e Triggers

- [ ] Abrir Supabase SQL Editor
- [ ] Executar Script 1 (calculate_word_score)
- [ ] Executar Script 2 (trigger_recalculate_score)
- [ ] Executar Script 3 (trigger_update_metrics_on_vote)
- [ ] Executar Script 4 (trigger_update_metrics_on_round_finish)
- [ ] Executar Script 5 (trigger_increment_word_selected)
- [ ] Executar Script 6 (get_weighted_random_words)
- [ ] Testar função: `SELECT * FROM get_weighted_random_words(4, 30)`

### ✅ Fase 3: Backend

- [ ] Atualizar `*.types.ts`
- [ ] Criar `word.service.ts` (este não é o nome do arquivo final)
- [ ] Criar serviço de feedback do usuário
- [ ] Atualizar lógica de seleção de palavras (usar `getRandomWeightedWords`)
- [ ] Testar endpoint de feedback

### ✅ Fase 4: Frontend

- [ ] Criar componente `RoundFeedback.tsx`
- [ ] Integrar no fluxo de resultados da rodada
- [ ] Testar UI em diferentes tamanhos de tela
- [ ] Garantir que feedback não é obrigatório (pode pular)
- [ ] Confirmar que não aparece novamente após submissão

### ✅ Fase 5: Limpeza

- [ ] Criar SQL helpers no Supabase (`deactivate_short_words`, `initialize_word_metrics`)
- [ ] Criar script `cleanup-words.ts`
- [ ] Rodar script: `tsx scripts/cleanup-words.ts`
- [ ] Verificar quantas palavras foram desativadas
- [ ] Confirmar que `word_metrics` foi inicializada

### ✅ Fase 6: Monitoramento

- [ ] (Opcional) Criar página de admin `/admin/metrics`
- [ ] Executar queries de análise no SQL Editor
- [ ] Após 1-2 semanas, revisar distribuição de scores
- [ ] Ajustar pesos se necessário
- [ ] Desativar palavras com score < 20 e > 10 jogadas

---

## 🚀 ORDEM DE EXECUÇÃO RECOMENDADA

**Dia 1:**

1. ✅ Fase 1 completa (Migrations)
2. ✅ Fase 2 completa (SQL Functions)
3. ✅ Fase 5 - Rodar limpeza inicial

**Dia 2:** 4. ✅ Fase 3 completa (Backend) 5. ✅ Testar endpoints manualmente

**Dia 3:** 6. ✅ Fase 4 completa (Frontend) 7. ✅ Testar fluxo completo do jogo

**Semana 2-3:** 8. ✅ Monitorar métricas 9. ✅ Coletar feedback dos jogadores

**Mês 1:** 10. ✅ Ajustar pesos do algoritmo 11. ✅ Desativar palavras ruins

---

## 🔧 FASE 1: Migrations (Kysely)

### Migration 1: Ajustar `word_votes` e criar `word_metrics`

```typescript
// migrations/YYYYMMDDHHMMSS_add_word_metrics_system.ts
import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  // 1. Ajustar word_votes para suportar feedback de rodadas
  await db.schema
    .alterTable("word_votes")
    .addColumn("round_id", "uuid")
    .addColumn("room_code", "varchar")
    .execute();

  // Remover constraint antiga se existir
  await sql`
    ALTER TABLE word_votes 
    DROP CONSTRAINT IF EXISTS word_votes_pkey
  `.execute(db);

  // Nova primary key composta
  await sql`
    ALTER TABLE word_votes
    ADD CONSTRAINT word_votes_pkey 
    PRIMARY KEY (word_id, user_id, round_id)
  `.execute(db);

  // Foreign key para game_rounds
  await sql`
    ALTER TABLE word_votes
    ADD CONSTRAINT fk_word_votes_round 
    FOREIGN KEY (round_id) 
    REFERENCES game_rounds(id) 
    ON DELETE CASCADE
  `.execute(db);

  // 2. Criar tabela word_metrics
  await db.schema
    .createTable("word_metrics")
    .addColumn("word_id", "uuid", (col) => col.primaryKey())
    .addColumn("times_selected", "integer", (col) => col.defaultTo(0).notNull())
    .addColumn("times_played", "integer", (col) => col.defaultTo(0).notNull())
    .addColumn("total_votes", "integer", (col) => col.defaultTo(0).notNull())
    .addColumn("correct_votes", "integer", (col) => col.defaultTo(0).notNull())
    .addColumn("thumbs_up", "integer", (col) => col.defaultTo(0).notNull())
    .addColumn("thumbs_down", "integer", (col) => col.defaultTo(0).notNull())
    .addColumn("score", "numeric", (col) => col.defaultTo(50).notNull())
    .addColumn("is_active", "boolean", (col) => col.defaultTo(true).notNull())
    .addColumn("updated_at", "timestamptz", (col) =>
      col.defaultTo(sql`now()`).notNull()
    )
    .execute();

  // Foreign key para words
  await sql`
    ALTER TABLE word_metrics
    ADD CONSTRAINT fk_word_metrics_word 
    FOREIGN KEY (word_id) 
    REFERENCES words(id) 
    ON DELETE CASCADE
  `.execute(db);

  // Índice essencial para performance
  await db.schema
    .createIndex("idx_word_metrics_active_score")
    .on("word_metrics")
    .columns(["score"])
    .where("is_active", "=", true)
    .execute();

  // Índice adicional para ordenação
  await db.schema
    .createIndex("idx_word_metrics_times_played")
    .on("word_metrics")
    .column("times_played")
    .execute();

  // 3. Inicializar word_metrics para palavras existentes
  await sql`
    INSERT INTO word_metrics (word_id, score, is_active)
    SELECT id, 50, true
    FROM words
    ON CONFLICT (word_id) DO NOTHING
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  // Rollback
  await db.schema.dropTable("word_metrics").ifExists().execute();

  await sql`
    ALTER TABLE word_votes 
    DROP CONSTRAINT IF EXISTS fk_word_votes_round
  `.execute(db);

  await sql`
    ALTER TABLE word_votes 
    DROP CONSTRAINT IF EXISTS word_votes_pkey
  `.execute(db);

  await db.schema
    .alterTable("word_votes")
    .dropColumn("round_id")
    .dropColumn("room_code")
    .execute();

  // Restaurar constraint antiga
  await sql`
    ALTER TABLE word_votes
    ADD CONSTRAINT word_votes_pkey 
    PRIMARY KEY (word_id, user_id)
  `.execute(db);
}
```

**Executar:**

```bash
npm run migrate:latest
# ou o comando que você usa para rodar migrations
```

---

## ⚙️ FASE 2: Functions e Triggers (Supabase SQL Editor)

Abra o **SQL Editor** no dashboard do Supabase e execute os seguintes scripts:

### Script 1: Função de Cálculo de Score

```sql
-- Função para calcular o score da palavra
CREATE OR REPLACE FUNCTION calculate_word_score(
    p_times_selected integer,
    p_times_played integer,
    p_total_votes integer,
    p_correct_votes integer,
    p_thumbs_up integer,
    p_thumbs_down integer
)
RETURNS numeric AS $$
DECLARE
    ctr numeric;
    difficulty_score numeric;
    feedback_score numeric;
    feedback_ratio numeric;
    final_score numeric;
BEGIN
    -- CTR: estimativa de click-through rate
    ctr := CASE 
        WHEN p_times_selected > 0 
        THEN LEAST((p_times_selected::numeric / GREATEST(p_times_played, 1)) * 100, 100)
        ELSE 50
    END;
    
    -- Dificuldade balanceada (ideal: 30-50% de acerto)
    difficulty_score := CASE
        WHEN p_total_votes = 0 THEN 50
        ELSE 
            CASE 
                WHEN (p_correct_votes::numeric / p_total_votes) BETWEEN 0.3 AND 0.5 
                THEN 100
                WHEN (p_correct_votes::numeric / p_total_votes) < 0.3 
                THEN GREATEST(100 - ((0.3 - (p_correct_votes::numeric / p_total_votes)) * 200), 0)
                ELSE GREATEST(100 - (((p_correct_votes::numeric / p_total_votes) - 0.5) * 200), 0)
            END
    END;
    
    -- 🔥 NOVO: Freio de falso-positivo
    -- Calcular ratio de feedback
    feedback_ratio := CASE
        WHEN (p_thumbs_up + p_thumbs_down) >= 3
        THEN p_thumbs_up::numeric / (p_thumbs_up + p_thumbs_down)
        ELSE 0.5  -- neutro se < 3 feedbacks
    END;
    
    -- Se feedback ruim (<45%) E palavra muito difícil (<15% acerto) → CAPA
    IF feedback_ratio < 0.45 
       AND p_total_votes > 0 
       AND (p_correct_votes::numeric / p_total_votes) < 0.15 THEN
        difficulty_score := LEAST(difficulty_score, 40);
    END IF;
    
    -- Feedback explícito (👍👎)
    feedback_score := CASE
        WHEN (p_thumbs_up + p_thumbs_down) > 0
        THEN (p_thumbs_up::numeric / (p_thumbs_up + p_thumbs_down)) * 100
        ELSE 50
    END;
    
    -- Score final ponderado
    final_score := (
        ctr * 0.20 +
        difficulty_score * 0.35 +
        feedback_score * 0.45
    );
    
    RETURN ROUND(final_score, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

### Script 2: Trigger para Recalcular Score Automaticamente

```sql
-- Trigger para recalcular score quando word_metrics é atualizado
CREATE OR REPLACE FUNCTION trigger_recalculate_score()
RETURNS TRIGGER AS $$
BEGIN
    NEW.score := calculate_word_score(
        NEW.times_selected,
        NEW.times_played,
        NEW.total_votes,
        NEW.correct_votes,
        NEW.thumbs_up,
        NEW.thumbs_down
    );
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS recalculate_score_trigger ON word_metrics;
CREATE TRIGGER recalculate_score_trigger
BEFORE UPDATE ON word_metrics
FOR EACH ROW
EXECUTE FUNCTION trigger_recalculate_score();
```

### Script 3: Trigger para Atualizar Métricas quando Voto é Inserido

```sql
-- Atualizar métricas quando usuário dá feedback (👍👎)
CREATE OR REPLACE FUNCTION trigger_update_metrics_on_vote()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO word_metrics (word_id, thumbs_up, thumbs_down, updated_at)
    VALUES (
        NEW.word_id,
        CASE WHEN NEW.vote > 0 THEN 1 ELSE 0 END,
        CASE WHEN NEW.vote < 0 THEN 1 ELSE 0 END,
        now()
    )
    ON CONFLICT (word_id) DO UPDATE SET
        thumbs_up = word_metrics.thumbs_up + (CASE WHEN NEW.vote > 0 THEN 1 ELSE 0 END),
        thumbs_down = word_metrics.thumbs_down + (CASE WHEN NEW.vote < 0 THEN 1 ELSE 0 END),
        updated_at = now();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_metrics_on_vote_trigger ON word_votes;
CREATE TRIGGER update_metrics_on_vote_trigger
AFTER INSERT ON word_votes
FOR EACH ROW
EXECUTE FUNCTION trigger_update_metrics_on_vote();
```

### Script 4: Trigger para Atualizar Métricas quando Rodada Termina

```sql
-- Atualizar métricas quando rodada é finalizada
CREATE OR REPLACE FUNCTION trigger_update_metrics_on_round_finish()
RETURNS TRIGGER AS $$
DECLARE
    total_votes_count int;
    correct_votes_count int;
BEGIN
    -- Só executar quando finished_at for preenchido (rodada terminou)
    IF NEW.finished_at IS NOT NULL AND (OLD.finished_at IS NULL OR OLD.finished_at IS DISTINCT FROM NEW.finished_at) THEN

        -- Contar votos da rodada
        SELECT
            COUNT(*),
            COUNT(*) FILTER (WHERE is_real_word = true)
        INTO total_votes_count, correct_votes_count
        FROM game_votes
        WHERE round_id = NEW.id;

        -- Atualizar métricas da palavra
        INSERT INTO word_metrics (
            word_id,
            times_played,
            total_votes,
            correct_votes,
            updated_at
        )
        VALUES (
            NEW.word_id,
            1,
            total_votes_count,
            correct_votes_count,
            now()
        )
        ON CONFLICT (word_id) DO UPDATE SET
            times_played = word_metrics.times_played + 1,
            total_votes = word_metrics.total_votes + total_votes_count,
            correct_votes = word_metrics.correct_votes + correct_votes_count,
            updated_at = now();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_metrics_on_round_finish_trigger ON game_rounds;
CREATE TRIGGER update_metrics_on_round_finish_trigger
AFTER UPDATE ON game_rounds
FOR EACH ROW
EXECUTE FUNCTION trigger_update_metrics_on_round_finish();
```

### Script 5: Trigger para Rastrear Seleção de Palavra

```sql
-- Incrementar times_selected quando palavra é escolhida (round criado)
CREATE OR REPLACE FUNCTION trigger_increment_word_selected()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.word_id IS NOT NULL THEN
        INSERT INTO word_metrics (word_id, times_selected, updated_at)
        VALUES (NEW.word_id, 1, now())
        ON CONFLICT (word_id) DO UPDATE SET
            times_selected = word_metrics.times_selected + 1,
            updated_at = now();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS increment_word_selected_trigger ON game_rounds;
CREATE TRIGGER increment_word_selected_trigger
AFTER INSERT ON game_rounds
FOR EACH ROW
EXECUTE FUNCTION trigger_increment_word_selected();
```

### Script 6: Função para Selecionar Palavras com Peso

```sql
-- Função para selecionar palavras aleatórias com peso baseado no score
CREATE OR REPLACE FUNCTION get_weighted_random_words(
    word_count integer DEFAULT 4,
    min_score numeric DEFAULT 30
)
RETURNS TABLE (
    id uuid,
    word text,
    definition text,
    score numeric,
    times_played integer
) AS $$
BEGIN
    RETURN QUERY
    WITH weighted_words AS (
        SELECT
            w.id,
            w.word,
            w.definition,
            wm.score,
            wm.times_played,
            -- Boost para palavras novas (menos de 5 jogadas)
            CASE
                WHEN wm.times_played < 5 THEN wm.score + 20
                ELSE wm.score
            END as adjusted_score,
            -- Random com peso baseado no score ajustado
            random() * (CASE
                WHEN wm.times_played < 5 THEN wm.score + 20
                ELSE wm.score
            END) as weighted_random
        FROM words w
        LEFT JOIN word_metrics wm ON w.id = wm.word_id
        WHERE COALESCE(wm.is_active, true) = true
            AND COALESCE(wm.score, 50) >= min_score
    )
    SELECT
        weighted_words.id,
        weighted_words.word,
        weighted_words.definition,
        weighted_words.score,
        weighted_words.times_played
    FROM weighted_words
    ORDER BY weighted_random DESC
    LIMIT word_count;
END;
$$ LANGUAGE plpgsql;
```

---

## 🔌 FASE 3: Backend/API (Next.js)

### 3.1. Atualizar Types do Kysely

```typescript
// lib/database.types.ts (adicionar aos tipos existentes)

export interface WordMetrics {
  word_id: string;
  times_selected: number;
  times_played: number;
  total_votes: number;
  correct_votes: number;
  thumbs_up: number;
  thumbs_down: number;
  score: number;
  is_active: boolean;
  updated_at: string;
}

export interface WordVote {
  word_id: string;
  user_id: string;
  round_id: string | null;
  room_code: string | null;
  vote: number;
  created_at: string;
}

// Adicionar ao Database interface
export interface Database {
  // ... suas tabelas existentes
  word_metrics: WordMetrics;
  word_votes: WordVote;
}
```

### 3.2. Criar Service para Palavras

```typescript
// TODO: adapt

import { createClient } from "@/lib/supabase/server";

export interface WordOption {
  id: string;
  word: string;
  definition: string;
  score: number;
  times_played: number;
}

export class WordService {
  /**
   * Buscar 4 palavras aleatórias com peso baseado no score
   * TODO: recebe os mesmos parâmetros que o método atual + minScore
   */
  static async getRandomWeightedWords(minScore = 30): Promise<WordOption[]> {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("get_weighted_random_words", {
      word_count: 4,
      min_score: minScore,
    });

    if (error) {
      console.error("Erro ao buscar palavras:", error);
      throw error;
    }

    return data || [];
  }

  /**
   * Registrar feedback do usuário sobre a palavra
   */
  static async submitWordFeedback(params: {
    wordId: string;
    userId: string;
    roundId: string;
    roomCode: string;
    vote: 1 | -1;
  }) {
    const supabase = await createClient();

    const { error } = await supabase.from("word_votes").insert({
      word_id: params.wordId,
      user_id: params.userId,
      round_id: params.roundId,
      room_code: params.roomCode,
      vote: params.vote,
    });

    if (error) {
      console.error("Erro ao registrar feedback:", error);
      throw error;
    }
  }

  /**
   * Buscar métricas de uma palavra específica
   */
  static async getWordMetrics(wordId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("word_metrics")
      .select("*")
      .eq("word_id", wordId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = not found
      console.error("Erro ao buscar métricas:", error);
      throw error;
    }

    return data;
  }

  /**
   * Buscar top palavras por score
   */
  static async getTopWords(limit = 50) {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("word_metrics")
      .select(
        `
        *,
        words:word_id (word, definition)
      `
      )
      .eq("is_active", true)
      .order("score", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Erro ao buscar top palavras:", error);
      throw error;
    }

    return data;
  }

  /**
   * Buscar palavras problemáticas (baixo score mas muitas jogadas)
   */
  static async getProblematicWords(minPlayed = 5, maxScore = 30) {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("word_metrics")
      .select(
        `
        *,
        words:word_id (word, definition)
      `
      )
      .gte("times_played", minPlayed)
      .lte("score", maxScore)
      .order("score", { ascending: true })
      .limit(50);

    if (error) {
      console.error("Erro ao buscar palavras problemáticas:", error);
      throw error;
    }

    return data;
  }
}
```

### 3.3. Criar API Route para Feedback

```typescript
// app/api/game/feedback/route.ts

import { NextRequest, NextResponse } from "next/server";
import { WordService } from "@/lib/services/word-service";
import { z } from "zod";

const feedbackSchema = z.object({
  wordId: z.string().uuid(),
  userId: z.string(),
  roundId: z.string().uuid(),
  roomCode: z.string(),
  vote: z.union([z.literal(1), z.literal(-1)]),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = feedbackSchema.parse(body);

    await WordService.submitWordFeedback(validated);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao processar feedback:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erro ao processar feedback" },
      { status: 500 }
    );
  }
}
```

### 3.4. Atualizar Lógica de Seleção de Palavras

```typescript
// Onde você atualmente seleciona palavras aleatórias, substituir por:

import { WordService } from "@/lib/services/word-service";

// Antes (exemplo):
// const words = await db.selectFrom('words').selectAll().limit(4).execute()

// Depois:
const wordOptions = await WordService.getRandomWeightedWords();

// O resto do código continua igual, mas agora as palavras têm peso baseado no score
```

---

## 🎨 FASE 4: Frontend (UI de Feedback)

### 4.1. Componente de Feedback

```typescript
"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";

interface RoundFeedbackProps {
  wordId: string;
  roundId: string;
  roomCode: string;
  userId: string;
  onComplete?: () => void;
}

export function RoundFeedback({
  wordId,
  roundId,
  roomCode,
  userId,
  onComplete,
}: RoundFeedbackProps) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFeedback = async (vote: 1 | -1) => {
    if (loading || submitted) return;

    setLoading(true);

    try {
      // TODO: use action server
      const response = await fetch("/api/game/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wordId,
          userId,
          roundId,
          roomCode,
          vote,
        }),
      });

      if (!response.ok) throw new Error("Erro ao enviar feedback");

      setSubmitted(true);
      onComplete?.();
    } catch (error) {
      console.error("Erro ao enviar feedback:", error);
      alert("Erro ao enviar feedback. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-4 text-green-600">
        ✓ Obrigado pelo feedback!
      </div>
    );
  }

  // TODO: usar estrutura de componentes atual
  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
      <h3 className="text-lg font-semibold text-center mb-4">
        Essa palavra foi boa para o jogo?
      </h3>

      <div className="flex gap-4 justify-center">
        <button
          onClick={() => handleFeedback(1)}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 
                     text-white rounded-lg font-medium transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ThumbsUp size={20} />
          Sim, boa!
        </button>

        <button
          onClick={() => handleFeedback(-1)}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 
                     text-white rounded-lg font-medium transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ThumbsDown size={20} />
          Não, ruim
        </button>
      </div>

      <p className="text-sm text-gray-500 text-center mt-4">
        Seu feedback ajuda a melhorar o jogo!
      </p>
    </div>
  );
}
```

### 4.2. Integrar no Fluxo do Jogo

```typescript
// Exemplo: onde você mostra os resultados da rodada

import { RoundFeedback } from "@/components/game/RoundFeedback";

function RoundResults({ round, roomCode, userId }) {
  const [showFeedback, setShowFeedback] = useState(true);

  return (
    <div>
      {/* Seus resultados existentes */}
      <div className="results">{/* ... pontuação, definições, etc ... */}</div>

      {/* Feedback (aparece após resultados) */}
      {showFeedback && (
        <div className="mt-8">
          <RoundFeedback
            wordId={round.word_id}
            roundId={round.id}
            roomCode={roomCode}
            userId={userId}
            onComplete={() => setShowFeedback(false)}
          />
        </div>
      )}

      {/* Botão próxima rodada */}
      <button onClick={nextRound} className="mt-6">
        Próxima Rodada
      </button>
    </div>
  );
}
```

---

## 🧹 FASE 5: Script de Limpeza Inicial

### 5.1. Script para Rodar uma Vez

```typescript
// scripts/cleanup-words.ts

import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role para admin
);

async function cleanupWords() {
  console.log("🧹 Iniciando limpeza de palavras...\n");

  // 1. Desativar plurais de nomes próprios
  console.log("1. Removendo plurais de nomes próprios...");
  const { data: plurals, error: e1 } = await supabase
    .from("words")
    .update({ is_active: false })
    .or("definition.ilike.%plural de %,definition.ilike.%feminino de %")
    .select("count");

  console.log(`   ✓ ${plurals?.length || 0} palavras desativadas\n`);

  // 2. Desativar verbos conjugados estranhos
  console.log("2. Removendo verbos conjugados (tu/vós)...");
  const { data: verbs, error: e2 } = await supabase
    .from("words")
    .update({ is_active: false })
    .eq("pos", "verb")
    .or("word.ilike.%ais,word.ilike.%eis,word.ilike.%astes,word.ilike.%estes")
    .select("count");

  console.log(`   ✓ ${verbs?.length || 0} verbos desativados\n`);

  // 3. Desativar palavras muito curtas (< 4 letras)
  console.log("3. Marcando palavras muito curtas...");
  const { data: short, error: e3 } = await supabase.rpc(
    "deactivate_short_words"
  );

  console.log(`   ✓ Palavras curtas processadas\n`);

  // 4. Inicializar word_metrics para palavras ativas
  console.log("4. Inicializando métricas...");
  const { error: e4 } = await supabase.rpc("initialize_word_metrics");

  console.log(`   ✓ Métricas inicializadas\n`);

  console.log("✅ Limpeza concluída!");

  // Mostrar estatísticas
  const { data: stats } = await supabase
    .from("words")
    .select("is_active", { count: "exact", head: true });

  console.log("\n📊 Estatísticas:");
  console.log(`   Total de palavras no banco: ${stats?.length || 0}`);
}

// SQL helpers necessários (rodar no Supabase SQL Editor antes):
/*
CREATE OR REPLACE FUNCTION deactivate_short_words()
RETURNS void AS $$
BEGIN
    UPDATE words
    SET is_active = false
    WHERE LENGTH(word) < 4;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION initialize_word_metrics()
RETURNS void AS $$
BEGIN
    INSERT INTO word_metrics (word_id, score, is_active)
    SELECT id, 50, COALESCE(is_active, true)
    FROM words
    ON CONFLICT (word_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;
*/

cleanupWords()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Erro:", error);
    process.exit(1);
  });
```

**Executar:**

```bash
# Primeiro, adicionar as SQL functions no Supabase (comentadas no script)
# Depois:
tsx scripts/cleanup-words.ts
```

---

## 📊 FASE 6: Monitoramento e Ajustes

### 6.1. Dashboard de Métricas (Opcional)

```typescript
// app/admin/metrics/page.tsx

import { WordService } from "@/lib/services/word-service";

export default async function MetricsPage() {
  const [topWords, problematicWords] = await Promise.all([
    WordService.getTopWords(20),
    WordService.getProblematicWords(),
  ]);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Métricas de Palavras</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Palavras */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-green-600">
            🏆 Top 20 Palavras
          </h2>
          <div className="space-y-2">
            {topWords.map((w, i) => (
              <div
                key={w.word_id}
                className="flex justify-between items-center p-2 hover:bg-gray-50"
              >
                <span className="font-mono text-sm">#{i + 1}</span>
                <span className="flex-1 mx-4">{w.words.word}</span>
                <span className="font-semibold text-green-600">
                  {w.score.toFixed(1)}
                </span>
                <span className="text-xs text-gray-500 ml-2">
                  ({w.times_played}x)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Palavras Problemáticas */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-red-600">
            ⚠️ Palavras Problemáticas
          </h2>
          <div className="space-y-2">
            {problematicWords.map((w) => (
              <div
                key={w.word_id}
                className="flex justify-between items-center p-2 hover:bg-gray-50"
              >
                <span className="flex-1">{w.words.word}</span>
                <span className="font-semibold text-red-600">
                  {w.score.toFixed(1)}
                </span>
                <span className="text-xs text-gray-500 ml-2">
                  ({w.times_played}x)
                </span>
                <span className="text-xs text-gray-500 ml-2">
                  👍{w.thumbs_up} 👎{w.thumbs_down}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Estatísticas Gerais */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">📈 Estatísticas Gerais</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Palavras Ativas" value={topWords.length} icon="✅" />
          <StatCard
            title="Score Médio"
            value={calculateAvgScore(topWords)}
            icon="📊"
          />
          <StatCard
            title="Palavras Jogadas"
            value={topWords.filter((w) => w.times_played > 0).length}
            icon="🎮"
          />
          <StatCard
            title="Necessitam Revisão"
            value={problematicWords.length}
            icon="⚠️"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number | string;
  icon: string;
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-gray-600">{title}</div>
    </div>
  );
}

function calculateAvgScore(words: any[]) {
  if (words.length === 0) return "0.0";
  const avg = words.reduce((sum, w) => sum + w.score, 0) / words.length;
  return avg.toFixed(1);
}
```

### 6.2. SQL Query para Análise Manual

```sql
-- Executar no Supabase SQL Editor quando quiser analisar

-- Visão geral do sistema
SELECT
    COUNT(*) as total_palavras,
    COUNT(*) FILTER (WHERE is_active = true) as ativas,
    COUNT(*) FILTER (WHERE times_played > 0) as jogadas,
    ROUND(AVG(score), 2) as score_medio,
    ROUND(AVG(score) FILTER (WHERE times_played > 5), 2) as score_medio_jogadas
FROM word_metrics;

-- Distribuição de scores
SELECT
    CASE
        WHEN score >= 80 THEN '80-100 (Excelente)'
        WHEN score >= 60 THEN '60-79 (Boa)'
        WHEN score >= 40 THEN '40-59 (Média)'
        WHEN score >= 20 THEN '20-39 (Ruim)'
        ELSE '0-19 (Péssima)'
    END as faixa_score,
    COUNT(*) as quantidade,
    ROUND(AVG(times_played), 1) as media_jogadas
FROM word_metrics
WHERE is_active = true
GROUP BY faixa_score
ORDER BY faixa_score DESC;

-- Palavras com mais feedback negativo
SELECT
    w.word,
    w.definition,
    wm.score,
    wm.thumbs_up,
    wm.thumbs_down,
    wm.times_played,
    ROUND((wm.thumbs_down::numeric / NULLIF(wm.thumbs_up + wm.thumbs_down, 0)) * 100, 1) as pct_negativo
FROM word_metrics wm
JOIN words w ON w.id = wm.word_id
WHERE (wm.thumbs_up + wm.thumbs_down) >= 3
ORDER BY pct_negativo DESC NULLS LAST
LIMIT 50;

-- Palavras nunca jogadas (amostra)
SELECT
    w.word,
    w.definition,
    w.pos,
    wm.score
FROM word_metrics wm
JOIN words w ON w.id = wm.word_id
WHERE wm.times_played = 0
    AND wm.is_active = true
ORDER BY RANDOM()
LIMIT 20;
```

### 6.3. Ajustar Pesos do Algoritmo (se necessário)

Após coletar dados por algumas semanas, você pode ajustar os pesos:

```sql
-- Atualizar a função de cálculo de score no Supabase SQL Editor

CREATE OR REPLACE FUNCTION calculate_word_score(
    p_times_selected integer,
    p_times_played integer,
    p_total_votes integer,
    p_correct_votes integer,
    p_thumbs_up integer,
    p_thumbs_down integer
)
RETURNS numeric AS $$
DECLARE
    ctr numeric;
    difficulty_score numeric;
    feedback_score numeric;
    final_score numeric;
BEGIN
    -- [mesmo código anterior...]

    -- AJUSTAR AQUI OS PESOS conforme análise:
    final_score := (
        ctr * 0.15 +              -- Reduzir se CTR não for relevante
        difficulty_score * 0.30 +  -- Aumentar se dificuldade for importante
        feedback_score * 0.55      -- Aumentar se feedback for muito confiável
    );

    RETURN ROUND(final_score, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Depois de alterar, recalcular todos os scores:
UPDATE word_metrics SET updated_at = now();
```

---

## 🔍 TESTES IMPORTANTES

### Teste 1: Trigger de Seleção

```sql
-- No SQL Editor, simular criação de round
INSERT INTO game_rounds (room_code, round_number, word_id, word_label, word_definition)
VALUES ('TEST', 1, (SELECT id FROM words LIMIT 1), 'teste', 'teste');

-- Verificar se times_selected foi incrementado
SELECT * FROM word_metrics WHERE word_id = (SELECT id FROM words LIMIT 1);
```

### Teste 2: Trigger de Finalização

```sql
-- Atualizar round para finished
UPDATE game_rounds
SET finished_at = now()
WHERE room_code = 'TEST';

-- Verificar se times_played foi incrementado
SELECT * FROM word_metrics WHERE word_id = (SELECT id FROM words LIMIT 1);
```

### Teste 3: Trigger de Feedback

```sql
-- Inserir voto
INSERT INTO word_votes (word_id, user_id, round_id, vote)
VALUES (
    (SELECT id FROM words LIMIT 1),
    'test-user',
    (SELECT id FROM game_rounds WHERE room_code = 'TEST'),
    1
);

-- Verificar se thumbs_up foi incrementado e score recalculado
SELECT * FROM word_metrics WHERE word_id = (SELECT id FROM words LIMIT 1);
```

### Teste 4: Seleção Ponderada

```sql
-- Verificar se função retorna palavras com scores variados
SELECT * FROM get_weighted_random_words(10, 0);

-- Executar múltiplas vezes e ver se palavras com score alto aparecem mais
```

---

## ⚠️ TROUBLESHOOTING

### Problema: Migration falha com "constraint already exists"

**Solução:**

```sql
-- No SQL Editor, dropar constraints antigas antes de rodar migration
ALTER TABLE word_votes DROP CONSTRAINT IF EXISTS word_votes_pkey CASCADE;
```

### Problema: Trigger não dispara

**Solução:**

```sql
-- Verificar se trigger existe
SELECT * FROM pg_trigger WHERE tgname LIKE '%word%';

-- Recriar trigger
DROP TRIGGER IF EXISTS trigger_name ON table_name;
-- Depois executar CREATE TRIGGER novamente
```

### Problema: Score sempre 50

**Solução:**

- Trigger `recalculate_score_trigger` precisa estar BEFORE UPDATE
- Verificar se função `calculate_word_score` está correta
- Forçar recálculo: `UPDATE word_metrics SET updated_at = now();`

### Problema: Palavras ruins continuam aparecendo

**Solução:**

```sql
-- Verificar se is_active está correto
SELECT is_active, COUNT(*) FROM word_metrics GROUP BY is_active;

-- Desativar manualmente se necessário
UPDATE word_metrics SET is_active = false WHERE score < 20 AND times_played > 5;
```

### Problema: Performance lenta na seleção

**Solução:**

```sql
-- Verificar índices
SELECT * FROM pg_indexes WHERE tablename = 'word_metrics';

-- Recriar índice se necessário
DROP INDEX IF EXISTS idx_word_metrics_active_score;
CREATE INDEX idx_word_metrics_active_score ON word_metrics(score DESC) WHERE is_active = true;
```

---

## 📚 DOCUMENTAÇÃO ADICIONAL

### Estrutura Final das Tabelas

```
words (existente)
├── id (PK)
├── word
├── definition
└── ...

word_metrics (nova)
├── word_id (PK, FK -> words.id)
├── times_selected
├── times_played
├── total_votes
├── correct_votes
├── thumbs_up
├── thumbs_down
├── score (calculado automaticamente)
├── is_active
└── updated_at

word_votes (modificada)
├── word_id (PK)
├── user_id (PK)
├── round_id (PK, FK -> game_rounds.id) ← NOVO
├── room_code ← NOVO
├── vote (1 ou -1)
└── created_at

game_rounds (existente)
├── id (PK)
├── word_id (FK -> words.id)
├── finished_at ← usado pelo trigger
└── ...
```

### Fluxo de Dados

```
1. Host escolhe palavra
   └→ INSERT game_rounds
      └→ TRIGGER increment_word_selected
         └→ UPDATE word_metrics.times_selected

2. Rodada termina
   └→ UPDATE game_rounds.finished_at
      └→ TRIGGER update_metrics_on_round_finish
         └→ UPDATE word_metrics (times_played, votes)
            └→ TRIGGER recalculate_score
               └→ UPDATE word_metrics.score

3. Jogador dá feedback
   └→ INSERT word_votes
      └→ TRIGGER update_metrics_on_vote
         └→ UPDATE word_metrics (thumbs_up/down)
            └→ TRIGGER recalculate_score
               └→ UPDATE word_metrics.score

4. Próxima rodada
   └→ SELECT get_weighted_random_words()
      └→ Palavras com score alto têm maior chance
```
