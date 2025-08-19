const express = require('express');
const { supabase } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/reports/leaderboard:
 *   get:
 *     summary: Obtener la tabla de posiciones global por puntos
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tabla de posiciones global
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
*                       name:
*                         type: string
*                       nickname:
*                         type: string
*                       email:
*                         type: string
*                       total_points:
*                         type: number
*                       tournaments_played:
*                         type: number
 */
router.get('/leaderboard', authenticateToken, async (req, res, next) => {
  try {
    // Obtener todos los registros de tournament_players
    const { data: tournamentPlayers, error: tpError } = await supabase
      .from('tournament_players')
      .select('user_id, points_earned');

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

    // Obtener perfiles de los usuarios
    const userIds = Array.from(userPointsMap.keys());
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, nickname, email')
      .in('id', userIds);

    if (profilesError) {
      console.error('Error fetching profiles for leaderboard:', profilesError);
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
    }).sort((a, b) => b.total_points - a.total_points); // Ordenar de mayor a menor puntos

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

module.exports = router;


