#!/usr/bin/env tsx

import { roomService } from '../src/server/services/room';

async function cleanup() {
  console.log('🧹 Iniciando limpeza de dados expirados...');
  
  try {
    await roomService.cleanup();
    console.log('✅ Limpeza concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
    process.exit(1);
  } finally {
    // Fechar conexão com o banco
    const { destroyDb } = await import('../src/infra/db');
    await destroyDb();
  }
}

cleanup();
