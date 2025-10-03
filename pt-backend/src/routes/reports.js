const express = require('express');
const { supabase } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/reports/leaderboard:
 *   get:
 *     summary: Obtener tabla de posiciones global por puntos acumulados
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Número máximo de resultados
 *     responses:
 *       200:
 *         description: Tabla de posiciones obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 leaderboard:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       user_id:
 *                         type: string
 *                         format: uuid
 *                         description: ID del usuario
 *                       name:
 *                         type: string
 *                         description: Nombre del usuario
 *                       nickname:
 *                         type: string
 *                         nullable: true
 *                         description: Apodo del usuario
 *                       email:
 *                         type: string
 *                         format: email
 *                         description: Email del usuario
 *                       total_points:
 *                         type: integer
 *                         description: Total de puntos acumulados
 *                       tournaments_played:
 *                         type: integer
 *                         description: Número de torneos jugados
 *       401:
 *         description: No autenticado
 */

/**
 * @swagger
 * /api/reports/tournament/{tournamentId}:
 *   get:
 *     summary: Obtener reporte detallado de un torneo específico
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tournamentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del torneo
 *     responses:
 *       200:
 *         description: Reporte del torneo obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tournament:
 *                   $ref: '#/components/schemas/Tournament'
 *                 players:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TournamentPlayer'
 *                 stats:
 *                   type: object
 *                   properties:
 *                     total_players:
 *                       type: integer
 *                     total_entry_fees:
 *                       type: number
 *                     total_rebuys:
 *                       type: integer
 *                     total_addons:
 *                       type: integer
 *                     total_prize_pool:
 *                       type: number
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Torneo no encontrado
 */

/**
 * @swagger
 * /api/reports/admin-income/{tournamentId}:
 *   get:
 *     summary: Obtener reporte de ingresos por administrador para un torneo
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tournamentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del torneo
 *     responses:
 *       200:
 *         description: Reporte de ingresos obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tournament_id:
 *                   type: string
 *                   format: uuid
 *                 summary:
 *                   type: object
 *                   properties:
 *                     total_entry_fees:
 *                       type: number
 *                       description: Total de entry fees cobrados
 *                     total_rebuys:
 *                       type: number
 *                       description: Total de rebuys cobrados
 *                     total_addons:
 *                       type: number
 *                       description: Total de addons cobrados
 *                     grand_total:
 *                       type: number
 *                       description: Total general
 *                 admin_breakdown:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       admin_id:
 *                         type: string
 *                         format: uuid
 *                       admin_name:
 *                         type: string
 *                       entry_fees:
 *                         type: number
 *                       rebuys:
 *                         type: number
 *                       addons:
 *                         type: number
 *                       total:
 *                         type: number
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permisos de administrador
 *       404:
 *         description: Torneo no encontrado
 */
router.get('/leaderboard', authenticateToken, async (req, res, next) => {
  try {
    console.log('🔍 Reports: Iniciando carga del leaderboard...');
    
    // Obtener todos los registros de tournament_players
    const { data: tournamentPlayers, error: tpError } = await supabase
      .from('tournament_players')
      .select('user_id, points_earned');
    
    console.log('📊 Reports: tournament_players obtenidos:', {
      hasData: !!tournamentPlayers,
      count: tournamentPlayers?.length || 0,
      data: tournamentPlayers
    });

    // Buscar específicamente al usuario "Carlos Javier pinto"
    const carlosPlayer = tournamentPlayers?.find(tp => {
      // Necesitamos verificar si este user_id corresponde a Carlos
      return tp.user_id;
    });
    console.log('🔍 Reports: Buscando usuario Carlos en tournament_players:', carlosPlayer);

    if (tpError) {
      console.error('Error fetching tournament players for leaderboard:', tpError);
      throw tpError;
    }

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

    // Obtener todos los usuarios únicos que han participado en torneos (incluso con 0 puntos)
    const allParticipatingUserIds = [...new Set(tournamentPlayers.map(tp => tp.user_id).filter(Boolean))];
    console.log('👥 Reports: Todos los usuarios que han participado en torneos:', {
      count: allParticipatingUserIds.length,
      userIds: allParticipatingUserIds
    });

    console.log('📊 Reports: userPointsMap después de procesar:', {
      hasData: userPointsMap.size > 0,
      count: userPointsMap.size,
      entries: Array.from(userPointsMap.entries()).map(([userId, stats]) => ({
        userId,
        total_points: stats.total_points,
        tournaments_played: stats.tournaments_played
      }))
    });
    
    console.log('📊 Reports: userPointsMap procesado:', {
      hasData: userPointsMap.size > 0,
      count: userPointsMap.size,
      data: Array.from(userPointsMap.entries())
    });

    // Obtener perfiles de TODOS los usuarios que han participado en torneos (incluso con 0 puntos)
    console.log('🔍 Reports: userIds para leaderboard (todos los participantes):', allParticipatingUserIds);
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, nickname, email, avatar_url')
      .in('id', allParticipatingUserIds);

    if (profilesError) {
      console.error('Error fetching profiles for leaderboard:', profilesError);
      throw profilesError;
    }

    console.log('👥 Reports: Perfiles obtenidos:', {
      count: profiles?.length || 0,
      profiles: profiles?.map(p => ({
        id: p.id,
        name: p.name,
        hasAvatar: !!p.avatar_url,
        avatarUrl: p.avatar_url
      }))
    });

    // Combinar datos y construir leaderboard
    const leaderboard = profiles.map(profile => {
      const stats = userPointsMap.get(profile.id) || { total_points: 0, tournaments_played: 0 };
      
      // Si no hay estadísticas en el mapa, calcular tournaments_played desde tournament_players
      if (!userPointsMap.has(profile.id)) {
        const userTournaments = tournamentPlayers.filter(tp => tp.user_id === profile.id);
        stats.tournaments_played = userTournaments.length;
      }
      
      return {
        user_id: profile.id,
        name: profile.name,
        nickname: profile.nickname,
        email: profile.email,
        avatar_url: profile.avatar_url,
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

    console.log('🏆 Reports: Leaderboard final:', {
      hasData: leaderboard.length > 0,
      count: leaderboard.length,
      data: leaderboard.map(entry => ({
        name: entry.name,
        total_points: entry.total_points,
        tournaments_played: entry.tournaments_played,
        hasAvatar: !!entry.avatar_url,
        avatarUrl: entry.avatar_url
      }))
    });

    res.json({ leaderboard });

  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/reports/player-tournaments/{userId}:
 *   get:
 *     summary: Obtener el detalle de torneos de un jugador específico
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Detalle de torneos del jugador
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tournaments:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       tournament_id:
 *                         type: string
 *                       tournament_name:
 *                         type: string
 *                       final_position:
 *                         type: number
 *                       points_earned:
 *                         type: number
 *                       tournament_date:
 *                         type: string
 */

/**
 * @swagger
 * /api/reports/player-tournaments/{userId}:
 *   get:
 *     summary: Obtener historial de torneos de un jugador
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Historial de torneos obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tournaments:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       tournament_id:
 *                         type: string
 *                         format: uuid
 *                       tournament_name:
 *                         type: string
 *                       final_position:
 *                         type: number
 *                       points_earned:
 *                         type: number
 *                       tournament_date:
 *                         type: string
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Usuario no encontrado
 */
router.get('/player-tournaments/:userId', authenticateToken, async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    // Primero obtener los tournament_players del usuario
    const { data: playerTournaments, error: ptError } = await supabase
      .from('tournament_players')
      .select(`
        tournament_id,
        final_position,
        points_earned
      `)
      .eq('user_id', userId);

    if (ptError) {
      console.error('Error fetching player tournaments:', ptError);
      throw ptError;
    }

    if (!playerTournaments || playerTournaments.length === 0) {
      return res.json({ tournaments: [] });
    }

    // Luego obtener los detalles de los torneos
    const tournamentIds = playerTournaments.map(pt => pt.tournament_id);
    const { data: tournaments, error: tournamentsError } = await supabase
      .from('tournaments')
      .select('id, name, scheduled_start_time')
      .in('id', tournamentIds)
      .order('scheduled_start_time', { ascending: false });

    if (tournamentsError) {
      console.error('Error fetching tournaments:', tournamentsError);
      throw tournamentsError;
    }

    // Combinar los datos
    const tournamentsMap = new Map(tournaments.map(t => [t.id, t]));
    const result = playerTournaments.map(pt => {
      const tournament = tournamentsMap.get(pt.tournament_id);
      return {
        tournament_id: pt.tournament_id,
        tournament_name: tournament?.name || 'Torneo Desconocido',
        final_position: pt.final_position,
        points_earned: pt.points_earned || 0,
        tournament_date: tournament?.scheduled_start_time
      };
    });

    res.json({ tournaments: result });

  } catch (error) {
    next(error);
  }
});

router.get('/admin-income/:tournamentId', authenticateToken, async (req, res, next) => {
  try {
    const { tournamentId } = req.params;

    console.log('🔍 Reports: Generando reporte de ingresos de admin para torneo:', tournamentId);

    // Verificar que el usuario sea administrador
    if (!req.profile?.is_admin) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Solo los administradores pueden acceder a este reporte'
      });
    }

    // Obtener datos del torneo
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('id, name, entry_fee')
      .eq('id', tournamentId)
      .single();

    if (tournamentError || !tournament) {
      return res.status(404).json({
        error: 'Tournament not found',
        message: 'Torneo no encontrado'
      });
    }

    // Obtener todos los rebuys del torneo
    const { data: rebuys, error: rebuysError } = await supabase
      .from('rebuys')
      .select('amount, admin_user_id')
      .eq('tournament_id', tournamentId);

    if (rebuysError) {
      console.error('Error fetching rebuys:', rebuysError);
      throw rebuysError;
    }

    // Obtener todos los addons del torneo
    const { data: addons, error: addonsError } = await supabase
      .from('addons')
      .select('amount, admin_user_id')
      .eq('tournament_id', tournamentId);

    if (addonsError) {
      console.error('Error fetching addons:', addonsError);
      throw addonsError;
    }

    // Obtener todas las confirmaciones de inscripción del torneo
    const { data: players, error: playersError } = await supabase
      .from('tournament_players')
      .select('registration_confirmed_by')
      .eq('tournament_id', tournamentId)
      .not('registration_confirmed_by', 'is', null);

    if (playersError) {
      console.error('Error fetching players:', playersError);
      throw playersError;
    }

    // Agrupar datos por administrador
    const adminData = new Map();

    // Procesar entry fees (confirmaciones de inscripción)
    players.forEach(player => {
      if (player.registration_confirmed_by) {
        if (!adminData.has(player.registration_confirmed_by)) {
          adminData.set(player.registration_confirmed_by, {
            admin_id: player.registration_confirmed_by,
            entry_fees: 0,
            rebuys: 0,
            addons: 0,
            total: 0
          });
        }
        const data = adminData.get(player.registration_confirmed_by);
        data.entry_fees += tournament.entry_fee;
        data.total += tournament.entry_fee;
      }
    });

    // Procesar rebuys
    rebuys.forEach(rebuy => {
      if (!adminData.has(rebuy.admin_user_id)) {
        adminData.set(rebuy.admin_user_id, {
          admin_id: rebuy.admin_user_id,
          entry_fees: 0,
          rebuys: 0,
          addons: 0,
          total: 0
        });
      }
      const data = adminData.get(rebuy.admin_user_id);
      data.rebuys += rebuy.amount;
      data.total += rebuy.amount;
    });

    // Procesar addons
    addons.forEach(addon => {
      if (!adminData.has(addon.admin_user_id)) {
        adminData.set(addon.admin_user_id, {
          admin_id: addon.admin_user_id,
          entry_fees: 0,
          rebuys: 0,
          addons: 0,
          total: 0
        });
      }
      const data = adminData.get(addon.admin_user_id);
      data.addons += addon.amount;
      data.total += addon.amount;
    });

    // Obtener nombres de administradores
    const adminIds = Array.from(adminData.keys());
    const adminBreakdown = [];

    if (adminIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', adminIds);

      if (profilesError) {
        console.error('Error fetching admin profiles:', profilesError);
        throw profilesError;
      }

      // Crear mapa de nombres
      const nameMap = new Map(profiles.map(p => [p.id, p.name || 'Admin Desconocido']));

      // Combinar datos
      adminIds.forEach(adminId => {
        const data = adminData.get(adminId);
        adminBreakdown.push({
          admin_id: adminId,
          admin_name: nameMap.get(adminId) || 'Admin Desconocido',
          entry_fees: data.entry_fees,
          rebuys: data.rebuys,
          addons: data.addons,
          total: data.total
        });
      });
    }

    // Calcular totales generales
    const totalEntryFees = adminBreakdown.reduce((sum, admin) => sum + admin.entry_fees, 0);
    const totalRebuys = adminBreakdown.reduce((sum, admin) => sum + admin.rebuys, 0);
    const totalAddons = adminBreakdown.reduce((sum, admin) => sum + admin.addons, 0);
    const grandTotal = totalEntryFees + totalRebuys + totalAddons;

    const result = {
      tournament_id: tournamentId,
      tournament_name: tournament.name,
      summary: {
        total_entry_fees: totalEntryFees,
        total_rebuys: totalRebuys,
        total_addons: totalAddons,
        grand_total: grandTotal
      },
      admin_breakdown: adminBreakdown
    };

    console.log('📊 Reports: Reporte de ingresos generado:', {
      tournament: tournament.name,
      totalAdmins: adminBreakdown.length,
      grandTotal
    });

    res.json(result);

  } catch (error) {
    console.error('Error generando reporte de ingresos:', error);
    next(error);
  }
});

module.exports = router;


