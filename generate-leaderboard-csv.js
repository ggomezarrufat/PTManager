#!/usr/bin/env node

/**
 * Script ad-hoc para generar un CSV con la tabla de posiciones de la temporada 2025
 * No forma parte de la aplicación, solo para uso temporal
 */

require('dotenv').config({ path: './pt-backend/.env' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno SUPABASE_URL o SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Función para escapar valores CSV
function escapeCsvValue(value) {
  if (value === null || value === undefined) {
    return '';
  }
  const stringValue = String(value);
  // Si contiene comas, comillas o saltos de línea, envolver en comillas y escapar comillas
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

// Función para generar CSV
function generateCSV(leaderboard) {
  const headers = ['Posición', 'Nombre', 'Apodo', 'Email', 'Puntos Totales', 'Torneos Jugados'];
  const rows = leaderboard.map((entry, index) => [
    index + 1,
    entry.name || '',
    entry.nickname || '',
    entry.email || '',
    entry.total_points || 0,
    entry.tournaments_played || 0
  ]);

  // Construir CSV
  const csvLines = [
    headers.map(escapeCsvValue).join(','),
    ...rows.map(row => row.map(escapeCsvValue).join(','))
  ];

  return csvLines.join('\n');
}

async function generateLeaderboardCSV() {
  try {
    const seasonName = process.argv[2] || '2025'; // Permitir pasar temporada como argumento
    console.log(`🔍 Buscando temporada "${seasonName}"...`);
    
    let tournamentIds = null;
    let seasonData = null;
    let seasonTitle = 'Todas las temporadas';
    
    // Buscar la temporada si se especifica
    if (seasonName && seasonName !== 'all') {
      const { data: season, error: seasonError } = await supabase
        .from('seasons')
        .select('id, name')
        .eq('name', seasonName)
        .single();

      if (seasonError || !season) {
        console.log(`⚠️  Temporada "${seasonName}" no encontrada`);
        console.log('📋 Temporadas disponibles:');
        const { data: allSeasons } = await supabase
          .from('seasons')
          .select('id, name, start_date, end_date')
          .order('name', { ascending: false });
        
        if (allSeasons && allSeasons.length > 0) {
          allSeasons.forEach(s => {
            console.log(`   - ${s.name} (ID: ${s.id})`);
          });
          console.log('\n💡 Usa: node generate-leaderboard-csv.js <nombre_temporada>');
          console.log('   O usa: node generate-leaderboard-csv.js all (para todas las temporadas)');
        } else {
          console.log('   No hay temporadas registradas');
          console.log('   Generando reporte de todos los torneos...');
        }
        
        // Continuar con todos los torneos si no se encuentra la temporada
        seasonTitle = `Todas las temporadas (${seasonName} no encontrada)`;
      } else {
        seasonData = season;
        seasonTitle = season.name;
        console.log(`✅ Temporada encontrada: ${season.name} (ID: ${season.id})`);

        // Obtener todos los torneos de esta temporada
        const { data: tournaments, error: tournamentsError } = await supabase
          .from('tournaments')
          .select('id, name')
          .eq('season_id', season.id);

        if (tournamentsError) {
          throw tournamentsError;
        }

        console.log(`📅 Torneos de la temporada: ${tournaments?.length || 0}`);

        if (!tournaments || tournaments.length === 0) {
          console.log('⚠️  No hay torneos en esta temporada');
          process.exit(0);
        }

        tournamentIds = tournaments.map(t => t.id);
      }
    } else {
      console.log('📊 Generando reporte de todas las temporadas...');
    }

    // Obtener registros de tournament_players (filtrados por temporada si se especifica)
    let tournamentPlayersQuery = supabase
      .from('tournament_players')
      .select('user_id, points_earned, tournament_id');
    
    if (tournamentIds) {
      tournamentPlayersQuery = tournamentPlayersQuery.in('tournament_id', tournamentIds);
    }
    
    const { data: tournamentPlayers, error: tpError } = await tournamentPlayersQuery;

    if (tpError) {
      throw tpError;
    }

    console.log(`👥 Registros de jugadores: ${tournamentPlayers?.length || 0}`);

    // Agrupar por user_id y sumar puntos
    const userPointsMap = new Map();
    tournamentPlayers.forEach(tp => {
      if (tp.user_id) {
        const current = userPointsMap.get(tp.user_id) || { total_points: 0, tournaments_played: 0 };
        userPointsMap.set(tp.user_id, {
          total_points: current.total_points + (tp.points_earned || 0),
          tournaments_played: current.tournaments_played + 1
        });
      }
    });

    // Obtener perfiles de usuarios
    const allParticipatingUserIds = [...new Set(tournamentPlayers.map(tp => tp.user_id).filter(Boolean))];
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, nickname, email, avatar_url')
      .in('id', allParticipatingUserIds);

    if (profilesError) {
      throw profilesError;
    }

    // Combinar datos y construir leaderboard
    const leaderboard = profiles.map(profile => {
      const stats = userPointsMap.get(profile.id) || { total_points: 0, tournaments_played: 0 };
      
      return {
        user_id: profile.id,
        name: profile.name,
        nickname: profile.nickname,
        email: profile.email,
        total_points: stats.total_points,
        tournaments_played: stats.tournaments_played
      };
    }).sort((a, b) => {
      // Ordenar primero por puntos (mayor a menor), luego por nombre (alfabético)
      if (b.total_points !== a.total_points) {
        return b.total_points - a.total_points;
      }
      return a.name.localeCompare(b.name);
    });

    console.log(`🏆 Jugadores en el leaderboard: ${leaderboard.length}`);

    // Generar CSV
    const csvContent = generateCSV(leaderboard);
    
    // Guardar archivo
    const dateStr = new Date().toISOString().split('T')[0];
    const seasonStr = seasonData ? seasonData.name : 'todas_temporadas';
    const filename = `leaderboard_${seasonStr}_${dateStr}.csv`;
    const filepath = path.join(process.cwd(), filename);
    
    fs.writeFileSync(filepath, csvContent, 'utf8');
    
    console.log(`\n✅ CSV generado exitosamente: ${filename}`);
    console.log(`📁 Ubicación: ${filepath}`);
    console.log(`\n📊 Resumen:`);
    console.log(`   - Temporada: ${seasonTitle}`);
    if (tournamentIds) {
      console.log(`   - Torneos incluidos: ${tournamentIds.length}`);
    }
    console.log(`   - Jugadores: ${leaderboard.length}`);
    console.log(`   - Total de puntos: ${leaderboard.reduce((sum, p) => sum + p.total_points, 0)}`);
    
  } catch (error) {
    console.error('❌ Error generando CSV:', error);
    process.exit(1);
  }
}

// Ejecutar
generateLeaderboardCSV();

