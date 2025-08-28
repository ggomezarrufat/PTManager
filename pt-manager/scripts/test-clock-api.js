#!/usr/bin/env node

/**
 * Script para probar las APIs del reloj
 * Ejecutar con: node scripts/test-clock-api.js
 */

const fetch = require('node-fetch');

// Configuración
const BASE_URL = process.env.VERCEL_URL || 'http://localhost:3000';

// IDs de prueba (ajustar según tu base de datos)
const TEST_TOURNAMENT_ID = 'test-tournament-id';
const TEST_USER_ID = 'test-user-id';

async function testAPI() {
  console.log('🧪 Iniciando pruebas de APIs del reloj...\n');

  try {
    // 1. Probar join
    console.log('1️⃣ Probando /api/clock/join');
    const joinResponse = await fetch(`${BASE_URL}/api/clock/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tournamentId: TEST_TOURNAMENT_ID, userId: TEST_USER_ID })
    });

    const joinData = await joinResponse.json();
    console.log('   Status:', joinResponse.status);
    console.log('   Response:', JSON.stringify(joinData, null, 2));

    if (!joinData.success) {
      console.log('   ⚠️ Join falló, pero puede ser normal si no hay torneo activo');
    }
    console.log('');

    // 2. Probar state
    console.log('2️⃣ Probando /api/clock/state');
    const stateResponse = await fetch(`${BASE_URL}/api/clock/state?tournamentId=${TEST_TOURNAMENT_ID}`);
    const stateData = await stateResponse.json();
    console.log('   Status:', stateResponse.status);
    console.log('   Response:', JSON.stringify(stateData, null, 2));
    console.log('');

    // 3. Probar sync (solo si hay torneos activos)
    console.log('3️⃣ Probando /api/clock/sync');
    const syncResponse = await fetch(`${BASE_URL}/api/clock/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const syncData = await syncResponse.json();
    console.log('   Status:', syncResponse.status);
    console.log('   Response:', JSON.stringify(syncData, null, 2));
    console.log('');

    // 4. Probar pause (si hay reloj activo)
    if (stateData.success && stateData.clockState) {
      console.log('4️⃣ Probando /api/clock/pause');
      const pauseResponse = await fetch(`${BASE_URL}/api/clock/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournamentId: TEST_TOURNAMENT_ID })
      });
      const pauseData = await pauseResponse.json();
      console.log('   Status:', pauseResponse.status);
      console.log('   Response:', JSON.stringify(pauseData, null, 2));
      console.log('');

      // 5. Probar resume
      console.log('5️⃣ Probando /api/clock/resume');
      const resumeResponse = await fetch(`${BASE_URL}/api/clock/resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournamentId: TEST_TOURNAMENT_ID })
      });
      const resumeData = await resumeResponse.json();
      console.log('   Status:', resumeResponse.status);
      console.log('   Response:', JSON.stringify(resumeData, null, 2));
      console.log('');
    }

    console.log('✅ Pruebas completadas!');

  } catch (error) {
    console.error('❌ Error en pruebas:', error.message);
    console.log('\n💡 Asegúrate de que:');
    console.log('   - El servidor esté ejecutándose');
    console.log('   - Las variables de entorno estén configuradas');
    console.log('   - La base de datos Supabase esté accesible');
  }
}

// Si se ejecuta directamente
if (require.main === module) {
  testAPI().catch(error => {
    console.error('Error fatal:', error);
    process.exit(1);
  });
}

module.exports = { testAPI };
