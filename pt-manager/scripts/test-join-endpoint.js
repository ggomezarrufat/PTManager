#!/usr/bin/env node

/**
 * Script para probar el endpoint /api/clock/join
 * Ejecutar con: node scripts/test-join-endpoint.js
 */

const fetch = require('node-fetch');

const API_BASE_URL = process.env.API_BASE_URL || 'https://copadesafio.vercel.app';
const TEST_TOURNAMENT_ID = process.env.TEST_TOURNAMENT_ID || 'test-tournament-id';
const TEST_USER_ID = process.env.TEST_USER_ID || 'test-user-id';

console.log('🔧 Variables de entorno configuradas:');
console.log('  API_BASE_URL:', API_BASE_URL);
console.log('  TEST_TOURNAMENT_ID:', TEST_TOURNAMENT_ID);
console.log('  TEST_USER_ID:', TEST_USER_ID);

async function testJoinEndpoint() {
  console.log('🧪 Probando endpoint /api/clock/join');
  console.log('📍 URL:', `${API_BASE_URL}/api/clock/join`);
  console.log('📊 Datos de prueba:', {
    tournamentId: TEST_TOURNAMENT_ID,
    userId: TEST_USER_ID
  });

  try {
    const response = await fetch(`${API_BASE_URL}/api/clock/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tournamentId: TEST_TOURNAMENT_ID,
        userId: TEST_USER_ID
      })
    });

    console.log('📡 Status:', response.status);
    console.log('📡 Status Text:', response.statusText);

    const data = await response.json();
    console.log('📦 Response:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('✅ Test exitoso');
    } else {
      console.log('❌ Test falló');
    }

  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
    console.error('Stack:', error.stack);
  }
}

testJoinEndpoint();
