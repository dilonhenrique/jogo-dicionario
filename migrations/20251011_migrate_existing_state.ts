/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Kysely } from 'kysely';
import type { GameState } from '../src/types/game';

interface GameSessionRow {
  room_code: string;
  game_state: unknown;
  created_at: Date;
  updated_at: Date;
}

export async function up(db: Kysely<any>): Promise<void> {
  // Buscar todas as sessões ativas
  const sessions = await db
    .selectFrom('game_sessions')
    .selectAll()
    .execute() as GameSessionRow[];

  console.log(`🔄 Migrando ${sessions.length} sessões...`);

  for (const session of sessions) {
    const state = session.game_state as GameState;
    
    if (!state) {
      console.log(`⚠️  Sessão ${session.room_code} não possui estado`);
      continue;
    }

    console.log(`📦 Migrando sessão ${session.room_code}...`);

    try {
      // 1. Migrar players
      if (state.players && state.players.length > 0) {
        await db.insertInto('game_players')
          .values(state.players.map(p => ({
            room_code: session.room_code,
            user_id: p.id,
            user_name: p.name,
            points: p.points || 0,
          })))
          .onConflict((oc) => oc
            .columns(['room_code', 'user_id'])
            .doUpdateSet({
              points: (eb: any) => eb.ref('excluded.points'),
              user_name: (eb: any) => eb.ref('excluded.user_name'),
            })
          )
          .execute();
        
        console.log(`  ✅ ${state.players.length} jogadores migrados`);
      }

      // 2. Migrar round history
      if (state.roundHistory && state.roundHistory.length > 0) {
        for (let i = 0; i < state.roundHistory.length; i++) {
          const round = state.roundHistory[i];
          const insertedRounds = await db.insertInto('game_rounds')
            .values({
              room_code: session.room_code,
              round_number: i + 1,
              word_id: round.word.id,
              word_label: round.word.label,
              word_definition: round.word.definition,
              finished_at: new Date(),
            })
            .onConflict((oc) => oc
              .columns(['room_code', 'round_number'])
              .doNothing()
            )
            .returning('id')
            .execute();

          if (insertedRounds.length > 0) {
            const insertedRound = insertedRounds[0];

            // Migrar fakes dessa rodada
            if (round.fakes && round.fakes.length > 0) {
              await db.insertInto('game_fake_definitions')
                .values(round.fakes.map(f => ({
                  round_id: insertedRound.id,
                  author_user_id: f.author.id,
                  definition: f.definition,
                })))
                .onConflict((oc) => oc
                  .columns(['round_id', 'author_user_id'])
                  .doNothing()
                )
                .execute();
            }
          }
        }
        
        console.log(`  ✅ ${state.roundHistory.length} rodadas históricas migradas`);
      }

      // 3. Migrar currentRound
      if (state.currentRound) {
        const currentRounds = await db.insertInto('game_rounds')
          .values({
            room_code: session.room_code,
            round_number: (state.roundHistory?.length || 0) + 1,
            word_id: state.currentRound.word.id,
            word_label: state.currentRound.word.label,
            word_definition: state.currentRound.word.definition,
            finished_at: null, // Rodada ativa
          })
          .onConflict((oc) => oc
            .columns(['room_code', 'round_number'])
            .doUpdateSet({
              word_id: (eb: any) => eb.ref('excluded.word_id'),
              word_label: (eb: any) => eb.ref('excluded.word_label'),
              word_definition: (eb: any) => eb.ref('excluded.word_definition'),
              finished_at: (eb: any) => eb.ref('excluded.finished_at'),
            })
          )
          .returning('id')
          .execute();

        if (currentRounds.length > 0) {
          const currentRound = currentRounds[0];

          // Migrar fakes da rodada atual
          if (state.currentRound.fakes && state.currentRound.fakes.length > 0) {
            await db.insertInto('game_fake_definitions')
              .values(state.currentRound.fakes.map(f => ({
                round_id: currentRound.id,
                author_user_id: f.author.id,
                definition: f.definition,
              })))
              .onConflict((oc) => oc
                .columns(['round_id', 'author_user_id'])
                .doUpdateSet({
                  definition: (eb: any) => eb.ref('excluded.definition'),
                })
              )
              .execute();
          }

          // Migrar votos da rodada atual
          if (state.votes && state.votes.length > 0) {
            await db.insertInto('game_votes')
              .values(state.votes.map(([userId, defId]) => ({
                round_id: currentRound.id,
                user_id: userId,
                definition_id: defId === state.currentRound!.word.id ? null : defId,
                is_real_word: defId === state.currentRound!.word.id,
              })))
              .onConflict((oc) => oc
                .columns(['round_id', 'user_id'])
                .doUpdateSet({
                  definition_id: (eb: any) => eb.ref('excluded.definition_id'),
                  is_real_word: (eb: any) => eb.ref('excluded.is_real_word'),
                })
              )
              .execute();
          }

          // Atualizar referência da rodada atual
          await db.updateTable('game_sessions')
            .set({ current_round_id: currentRound.id })
            .where('room_code', '=', session.room_code)
            .execute();
          
          console.log(`  ✅ Rodada atual migrada (${state.currentRound.fakes?.length || 0} fakes, ${state.votes?.length || 0} votos)`);
        }
      }

      // 4. Atualizar stage
      if (state.stage) {
        await db.updateTable('game_sessions')
          .set({ stage: state.stage })
          .where('room_code', '=', session.room_code)
          .execute();
        
        console.log(`  ✅ Stage atualizado: ${state.stage}`);
      }

      console.log(`✅ Sessão ${session.room_code} migrada com sucesso!`);
    } catch (error) {
      console.error(`❌ Erro ao migrar sessão ${session.room_code}:`, error);
      // Continua para a próxima sessão em caso de erro
    }
  }

  console.log(`\n🎉 Migração concluída! ${sessions.length} sessões processadas.`);
}

export async function down(db: Kysely<any>): Promise<void> {
  // Limpar dados migrados (em ordem reversa devido às foreign keys)
  await db.deleteFrom('game_votes').execute();
  await db.deleteFrom('game_fake_definitions').execute();
  await db.deleteFrom('game_rounds').execute();
  await db.deleteFrom('game_players').execute();
  
  // Resetar campos em game_sessions
  await db.updateTable('game_sessions')
    .set({ 
      stage: 'word_pick',
      current_round_id: null,
    })
    .execute();
    
  console.log('✅ Rollback da migração de dados concluído');
}
