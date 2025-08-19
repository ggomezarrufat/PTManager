const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { supabase } = require('../config/supabase');
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     TournamentPlayer:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         tournament_id:
 *           type: string
 *         user_id:
 *           type: string
 *         current_chips:
 *           type: number
 *         entry_fee_paid:
 *           type: number
 *         registration_time:
 *           type: string
 *         final_position:
 *           type: number
 *         points_earned:
 *           type: number
 *         is_active:
 *           type: boolean
 *         is_eliminated:
 *           type: boolean
 *         eliminated_at:
 *           type: string
 */

/**
 * @swagger
 * /api/tournaments/{tournamentId}/players:
 *   get:
 *     summary: Obtener jugadores de un torneo
 *     tags: [Players]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tournamentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de jugadores del torneo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 players:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TournamentPlayer'
 */
router.get('/tournaments/:tournamentId/players', 
  authenticateToken,
  [
    param('tournamentId').isUUID().withMessage('Tournament ID debe ser un UUID válido')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Datos de entrada inválidos',
          details: errors.array()
        });
      }

      const { tournamentId } = req.params;

      // 1) Obtener jugadores (sin joins para evitar dependencia de FK)
      const { data: players, error: playersError } = await supabase
        .from('tournament_players')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('registration_time', { ascending: true });

      if (playersError) {
        console.error('Error obteniendo jugadores:', playersError);
        throw playersError;
      }

      const userIds = (players || []).map(p => p.user_id).filter(Boolean);

      let profilesById = {};
      if (userIds.length > 0) {
        // 2) Obtener perfiles asociados
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds);

        if (profilesError) {
          console.error('Error obteniendo perfiles:', profilesError);
          throw profilesError;
        }

        profilesById = (profiles || []).reduce((acc, prof) => {
          acc[prof.id] = prof;
          return acc;
        }, {});
      }

      // 3) Fusionar
      const formattedPlayers = (players || []).map(player => ({
        ...player,
        user: profilesById[player.user_id] || null
      }));

      res.json({
        message: 'Jugadores obtenidos exitosamente',
        players: formattedPlayers
      });

    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/players/{playerId}:
 *   delete:
 *     summary: Desregistrar jugador del torneo (eliminar inscripción)
 *     tags: [Players]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: playerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Jugador desregistrado
 */
router.delete('/players/:playerId',
  authenticateToken,
  [
    param('playerId').isUUID().withMessage('Player ID debe ser un UUID válido')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Datos de entrada inválidos',
          details: errors.array()
        });
      }

      const { playerId } = req.params;

      const { error } = await supabase
        .from('tournament_players')
        .delete()
        .eq('id', playerId);

      if (error) {
        console.error('Error desregistrando jugador:', error);
        throw error;
      }

      res.json({ message: 'Jugador desregistrado exitosamente' });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/tournaments/{tournamentId}/players:
 *   post:
 *     summary: Agregar jugador a un torneo
 *     tags: [Players]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tournamentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - entry_fee_paid
 *             properties:
 *               user_id:
 *                 type: string
 *               entry_fee_paid:
 *                 type: number
 *     responses:
 *       201:
 *         description: Jugador agregado exitosamente
 */
router.post('/tournaments/:tournamentId/players',
  authenticateToken,
  [
    param('tournamentId').isUUID().withMessage('Tournament ID debe ser un UUID válido'),
    body('user_id').isUUID().withMessage('User ID debe ser un UUID válido'),
    body('entry_fee_paid').isNumeric().withMessage('Entry fee debe ser un número válido')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Datos de entrada inválidos',
          details: errors.array()
        });
      }

      const { tournamentId } = req.params;
      const { user_id, entry_fee_paid } = req.body;

      // Verificar que el torneo existe
      const { data: tournament, error: tournamentError } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', tournamentId)
        .single();

      if (tournamentError || !tournament) {
        return res.status(404).json({
          error: 'Tournament Not Found',
          message: 'Torneo no encontrado'
        });
      }

      // Verificar que el usuario no esté ya registrado
      const { data: existingPlayer } = await supabase
        .from('tournament_players')
        .select('id')
        .eq('tournament_id', tournamentId)
        .eq('user_id', user_id)
        .single();

      if (existingPlayer) {
        return res.status(400).json({
          error: 'Player Already Registered',
          message: 'El jugador ya está registrado en este torneo'
        });
      }

      // Agregar jugador
      const { data: inserted, error: playerError } = await supabase
        .from('tournament_players')
        .insert({
          tournament_id: tournamentId,
          user_id,
          current_chips: tournament.initial_chips,
          entry_fee_paid,
          registration_time: new Date().toISOString(),
          points_earned: 0,
          is_active: true,
          is_eliminated: false
        })
        .select('*')
        .single();

      if (playerError) {
        console.error('Error agregando jugador:', playerError);
        throw playerError;
      }

      // Obtener perfil del usuario insertado
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user_id)
        .single();

      res.status(201).json({
        message: 'Jugador agregado exitosamente',
        player: {
          ...inserted,
          user: profile || null
        }
      });

    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/players/{playerId}/eliminate:
 *   put:
 *     summary: Eliminar jugador del torneo
 *     tags: [Players]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: playerId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - final_position
 *             properties:
 *               final_position:
 *                 type: number
 *     responses:
 *       200:
 *         description: Jugador eliminado exitosamente
 */
router.put('/players/:playerId/eliminate',
  authenticateToken,
  [
    param('playerId').isUUID().withMessage('Player ID debe ser un UUID válido'),
    body('final_position').isInt({ min: 1 }).withMessage('Final position debe ser un número entero positivo')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Datos de entrada inválidos',
          details: errors.array()
        });
      }

      const { playerId } = req.params;
      const { final_position } = req.body;

      const { data: updatedPlayer, error } = await supabase
        .from('tournament_players')
        .update({
          is_active: false,
          is_eliminated: true,
          eliminated_at: new Date().toISOString(),
          final_position
        })
        .eq('id', playerId)
        .select()
        .single();

      if (error) {
        console.error('Error eliminando jugador:', error);
        throw error;
      }

      res.json({
        message: 'Jugador eliminado exitosamente',
        player: updatedPlayer
      });

    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/players/{playerId}/results:
 *   put:
 *     summary: Actualizar resultados de un jugador del torneo (posición final y puntos)
 *     tags: [Players]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: playerId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               final_position:
 *                 type: number
 *               points_earned:
 *                 type: number
 *     responses:
 *       200:
 *         description: Resultados actualizados exitosamente
 */
router.put('/players/:playerId/results',
  authenticateToken,
  requireAdmin,
  [
    param('playerId').isUUID().withMessage('Player ID debe ser un UUID válido'),
    body('final_position').optional().isInt({ min: 1 }).withMessage('Final position debe ser un entero positivo'),
    body('points_earned').optional().isInt({ min: 0 }).withMessage('Points debe ser un entero no negativo')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Datos de entrada inválidos',
          details: errors.array()
        });
      }

      const { playerId } = req.params;
      const { final_position, points_earned } = req.body;

      const updateData = {};
      if (typeof final_position !== 'undefined') updateData.final_position = final_position;
      if (typeof points_earned !== 'undefined') updateData.points_earned = points_earned;

      // Si se establece posición final, marcar eliminado e inactivo si aún no lo estaba
      if (typeof final_position !== 'undefined') {
        updateData.is_eliminated = true;
        updateData.is_active = false;
        updateData.eliminated_at = new Date().toISOString();
      }

      const { data: updatedPlayer, error } = await supabase
        .from('tournament_players')
        .update(updateData)
        .eq('id', playerId)
        .select()
        .single();

      if (error) {
        console.error('Error actualizando resultados:', error);
        throw error;
      }

      res.json({
        message: 'Resultados actualizados exitosamente',
        player: updatedPlayer
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/tournaments/{tournamentId}/results:
 *   put:
 *     summary: Actualizar en bloque resultados (posición y puntos) de un torneo finalizado
 *     tags: [Players]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tournamentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - results
 *             properties:
 *               results:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [player_id]
 *                   properties:
 *                     player_id:
 *                       type: string
 *                     final_position:
 *                       type: number
 *                     points_earned:
 *                       type: number
 *     responses:
 *       200:
 *         description: Resultados actualizados
 */
router.put('/tournaments/:tournamentId/results',
  authenticateToken,
  requireAdmin,
  [
    param('tournamentId').isUUID().withMessage('Tournament ID debe ser un UUID válido'),
    body('results').isArray({ min: 1 }).withMessage('results debe ser un array no vacío'),
    body('results.*.player_id').isUUID().withMessage('player_id debe ser UUID válido'),
    body('results.*.final_position').optional().isInt({ min: 1 }).withMessage('final_position debe ser entero positivo'),
    body('results.*.points_earned').optional().isInt({ min: 0 }).withMessage('points_earned debe ser entero no negativo')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Datos de entrada inválidos',
          details: errors.array()
        });
      }

      const { tournamentId } = req.params;
      const { results } = req.body;

      // Verificar torneo finalizado (opcional pero recomendado)
      const { data: tournament } = await supabase
        .from('tournaments')
        .select('status')
        .eq('id', tournamentId)
        .single();

      if (!tournament || tournament.status !== 'finished') {
        return res.status(400).json({
          error: 'Invalid Tournament Status',
          message: 'Solo se pueden editar resultados de torneos finalizados'
        });
      }

      const updates = [];
      for (const item of results) {
        const updateData = {};
        if (typeof item.final_position !== 'undefined') {
          updateData.final_position = item.final_position;
          updateData.is_eliminated = true;
          updateData.is_active = false;
          updateData.eliminated_at = new Date().toISOString();
        }
        if (typeof item.points_earned !== 'undefined') {
          updateData.points_earned = item.points_earned;
        }
        updates.push(
          supabase
            .from('tournament_players')
            .update(updateData)
            .eq('id', item.player_id)
            .select()
            .single()
        );
      }

      const resultsUpdates = await Promise.all(updates);
      const players = resultsUpdates.map(r => r.data).filter(Boolean);

      res.json({
        message: 'Resultados actualizados',
        players
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/players/{playerId}/chips:
 *   put:
 *     summary: Actualizar fichas de un jugador
 *     tags: [Players]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: playerId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - current_chips
 *             properties:
 *               current_chips:
 *                 type: number
 *     responses:
 *       200:
 *         description: Fichas actualizadas exitosamente
 */
router.put('/players/:playerId/chips',
  authenticateToken,
  [
    param('playerId').isUUID().withMessage('Player ID debe ser un UUID válido'),
    body('current_chips').isInt({ min: 0 }).withMessage('Current chips debe ser un número entero no negativo')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Datos de entrada inválidos',
          details: errors.array()
        });
      }

      const { playerId } = req.params;
      const { current_chips } = req.body;

      const { data: updatedPlayer, error } = await supabase
        .from('tournament_players')
        .update({ current_chips })
        .eq('id', playerId)
        .select()
        .single();

      if (error) {
        console.error('Error actualizando fichas:', error);
        throw error;
      }

      res.json({
        message: 'Fichas actualizadas exitosamente',
        player: updatedPlayer
      });

    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;

