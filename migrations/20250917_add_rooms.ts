import type { Kysely } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('rooms')
    .addColumn('code', 'varchar(8)', (col) => col.primaryKey())
    .addColumn('host_user_id', 'varchar(255)', (col) => col.notNull())
    .addColumn('host_user_name', 'varchar(255)', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) => col.defaultTo('now()').notNull())
    .addColumn('expires_at', 'timestamptz', (col) => col.notNull())
    .execute();

  // Index para cleanup automático
  await db.schema
    .createIndex('idx_rooms_expires')
    .on('rooms')
    .column('expires_at')
    .execute();

  // Index para buscar salas por host
  await db.schema
    .createIndex('idx_rooms_host')
    .on('rooms')
    .column('host_user_id')
    .execute();

  // Adicionar foreign key constraint para game_sessions agora que rooms existe
  await db.schema
    .alterTable('game_sessions')
    .addForeignKeyConstraint('fk_game_sessions_room_code', ['room_code'], 'rooms', ['code'])
    .onDelete('cascade')
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  // Remover foreign key constraint primeiro
  await db.schema
    .alterTable('game_sessions')
    .dropConstraint('fk_game_sessions_room_code')
    .execute();
    
  await db.schema.dropTable('rooms').execute();
}
