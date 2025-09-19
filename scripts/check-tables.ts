#!/usr/bin/env tsx

import { getDb } from '../src/infra/db';
import { sql } from 'kysely';

async function checkTables() {
  const db = getDb();
  
  console.log('🔍 Verificando estrutura das tabelas...\n');
  
  try {
    // Verificar game_sessions
    console.log('📋 Tabela: game_sessions');
    const gameSessionsColumns = await sql<{column_name: string, data_type: string, is_nullable: string}>`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'game_sessions'
      ORDER BY ordinal_position
    `.execute(db);
    
    gameSessionsColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
    });
    
    // Verificar rooms
    console.log('\n📋 Tabela: rooms');
    const roomsColumns = await sql<{column_name: string, data_type: string, is_nullable: string}>`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'rooms'
      ORDER BY ordinal_position
    `.execute(db);
    
    roomsColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
    });
    
    // Verificar foreign keys
    console.log('\n🔗 Foreign Keys:');
    const foreignKeys = await sql<{table_name: string, constraint_name: string, column_name: string, foreign_table_name: string, foreign_column_name: string}>`
      SELECT 
        tc.table_name, 
        tc.constraint_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name IN ('game_sessions', 'rooms')
    `.execute(db);
    
    foreignKeys.rows.forEach(fk => {
      console.log(`  - ${fk.table_name}.${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    const { destroyDb } = await import('../src/infra/db');
    await destroyDb();
  }
}

checkTables();
