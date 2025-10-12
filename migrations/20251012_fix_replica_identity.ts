import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  // Para game_votes: adicionar room_code na replica identity
  // Isso permite que o Supabase Realtime envie room_code no payload.old dos DELETEs
  await sql`ALTER TABLE game_votes REPLICA IDENTITY FULL`.execute(db);
  
  // Para game_fake_definitions: mesma coisa
  await sql`ALTER TABLE game_fake_definitions REPLICA IDENTITY FULL`.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  // Voltar para o padrão (apenas PRIMARY KEY)
  await sql`ALTER TABLE game_votes REPLICA IDENTITY DEFAULT`.execute(db);
  await sql`ALTER TABLE game_fake_definitions REPLICA IDENTITY DEFAULT`.execute(db);
}
