#!/usr/bin/env node

/**
 * Script para sincronizar relojes de torneos periódicamente
 * Ejecutar con: node scripts/sync-clocks.js
 *
 * Para uso en producción con cron:
 * */1 * * * * /usr/bin/node /path/to/scripts/sync-clocks.js
 */

const fetch = require('node-fetch');

// Configuración
const VERCEL_URL = process.env.VERCEL_URL || 'http://localhost:3000';
const SYNC_INTERVAL = 1000; // 1 segundo (igual que el servidor original)

async function syncClocks() {
  try {
    console.log(`🔄 [${new Date().toISOString()}] Iniciando sincronización de relojes...`);

    const response = await fetch(`${VERCEL_URL}/api/clock/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    });

    const data = await response.json();

    if (data.success) {
      console.log(`✅ [${new Date().toISOString()}] Sincronización completada: ${data.synced_tournaments}/${data.total_tournaments} torneos`);
    } else {
      console.error(`❌ [${new Date().toISOString()}] Error en sincronización:`, data.error);
    }

  } catch (error) {
    console.error(`❌ [${new Date().toISOString()}] Error de conexión:`, error.message);
  }
}

async function runContinuousSync() {
  console.log('🚀 Iniciando sincronización continua de relojes...');
  console.log(`📊 Intervalo: ${SYNC_INTERVAL}ms`);
  console.log(`🌐 URL: ${VERCEL_URL}`);

  // Ejecutar sincronización inicial
  await syncClocks();

  // Configurar sincronización periódica
  setInterval(syncClocks, SYNC_INTERVAL);

  console.log('⏰ Sistema de sincronización iniciado - ejecutándose cada segundo');
}

// Si se ejecuta directamente
if (require.main === module) {
  runContinuousSync().catch(error => {
    console.error('Error fatal:', error);
    process.exit(1);
  });
}

module.exports = { syncClocks, runContinuousSync };
