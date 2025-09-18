import fs from 'fs';
import path from 'path';
import { getDb } from '../src/infra/db';
import { sql } from 'kysely';

interface Migration {
  name: string;
  up: (db: ReturnType<typeof getDb>) => Promise<void>;
  down: (db: ReturnType<typeof getDb>) => Promise<void>;
}

async function createMigrationsTable() {
  const db = getDb();
  
  await sql`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMPTZ DEFAULT NOW()
    )
  `.execute(db);
}

async function getExecutedMigrations(): Promise<string[]> {
  const db = getDb();
  
  try {
    const result = await sql<{ name: string }>`
      SELECT name FROM migrations ORDER BY executed_at
    `.execute(db);
    
    return result.rows.map(row => row.name);
  } catch {
    return [];
  }
}

async function markMigrationAsExecuted(name: string) {
  const db = getDb();
  
  await sql`
    INSERT INTO migrations (name) VALUES (${name})
  `.execute(db);
}

async function loadMigrations(): Promise<Migration[]> {
  const migrationsDir = path.join(process.cwd(), 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.ts'))
    .sort();

  const migrations: Migration[] = [];

  for (const file of files) {
    const migrationPath = path.join(migrationsDir, file);
    const migration = await import(migrationPath);
    
    migrations.push({
      name: file.replace('.ts', ''),
      up: migration.up,
      down: migration.down
    });
  }

  return migrations;
}

async function runMigrations() {
  console.log('🚀 Iniciando processo de migration...');
  
  await createMigrationsTable();
  
  const migrations = await loadMigrations();
  const executedMigrations = await getExecutedMigrations();
  
  console.log(`📋 Encontradas ${migrations.length} migrations`);
  console.log(`✅ ${executedMigrations.length} migrations já executadas`);
  
  const migrationsToRun = migrations.filter(
    migration => !executedMigrations.includes(migration.name)
  );
  
  if (migrationsToRun.length === 0) {
    console.log('✨ Todas as migrations já foram executadas!');
    return;
  }
  
  console.log(`🔄 Executando ${migrationsToRun.length} migrations pendentes...`);
  
  const db = getDb();
  
  for (const migration of migrationsToRun) {
    try {
      console.log(`⚡ Executando: ${migration.name}`);
      await migration.up(db);
      await markMigrationAsExecuted(migration.name);
      console.log(`✅ Concluída: ${migration.name}`);
    } catch (error) {
      console.error(`❌ Erro na migration ${migration.name}:`, error);
      process.exit(1);
    }
  }
  
  console.log('🎉 Todas as migrations foram executadas com sucesso!');
}

// Resetar todas as migrations (recrear do zero)
async function resetMigrations() {
  console.log('🔄 Resetando todas as migrations...');
  
  const db = getDb();
  const migrations = await loadMigrations();
  
  // Executar down de todas as migrations em ordem reversa
  console.log('📉 Executando rollback das migrations...');
  for (const migration of [...migrations].reverse()) {
    try {
      console.log(`⚡ Rollback: ${migration.name}`);
      await migration.down(db);
    } catch (error) {
      console.log(`⚠️  Erro no rollback de ${migration.name} (pode ser normal se não existir):`, error);
    }
  }
  
  // Limpar tabela de migrations
  try {
    await sql`DROP TABLE IF EXISTS migrations`.execute(db);
    console.log('🗑️  Tabela de migrations limpa');
  } catch (error) {
    console.log('⚠️  Erro ao limpar tabela de migrations:', error);
  }
  
  // Recriar tudo do zero
  console.log('🔄 Recriando migrations do zero...');
  await runMigrations();
}

async function migrationStatus() {
  console.log('📊 Status das migrations:');
  
  await createMigrationsTable();
  
  const migrations = await loadMigrations();
  const executedMigrations = await getExecutedMigrations();
  
  for (const migration of migrations) {
    const isExecuted = executedMigrations.includes(migration.name);
    const status = isExecuted ? '✅' : '⏳';
    console.log(`${status} ${migration.name}`);
  }
}

async function main() {
  const command = process.argv[2];
  
  try {
    switch (command) {
      case 'up':
        await runMigrations();
        break;
      case 'status':
        await migrationStatus();
        break;
      case 'reset':
        await resetMigrations();
        break;
      default:
        console.log('Uso: npm run migrate [comando]');
        console.log('Comandos disponíveis:');
        console.log('  up       Executar migrations pendentes');
        console.log('  status   Mostrar status das migrations');
        console.log('  reset    Resetar e recriar todas as migrations');
    }
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    const { destroyDb } = await import('../src/infra/db');
    await destroyDb();
  }
}

main();
