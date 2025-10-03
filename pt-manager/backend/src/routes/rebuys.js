const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const { supabase } = require('../config/supabase');
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Rebuy:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID único de la recompra
 *         player_id:
 *           type: string
 *           format: uuid
 *           description: ID del jugador
 *         tournament_id:
 *           type: string
 *           format: uuid
 *           description: ID del torneo
 *         amount:
 *           type: string
 *           description: Monto pagado por la recompra
 *         chips_received:
 *           type: integer
 *           description: Número de fichas recibidas
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Fecha y hora de la recompra
 *         admin_user_id:
 *           type: string
 *           format: uuid
 *           description: ID del administrador que registró la recompra
 */

/**
 * @swagger
 * /api/players/{playerId}/rebuys:
 *   post:
 *     summary: Registrar nueva recompra para un jugador
 *     tags: [Recompras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: playerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del jugador
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - chips_received
 *               - admin_user_id
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 0
 *                 description: Cantidad pagada por la recompra
 *               chips_received:
 *                 type: integer
 *                 minimum: 1
 *                 description: Fichas recibidas por la recompra
 *               admin_user_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID del administrador que registra la recompra
 *     responses:
 *       201:
 *         description: Recompra registrada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 rebuy:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       description: ID de la recompra
 *                     player_id:
 *                       type: string
 *                       format: uuid
 *                       description: ID del jugador
 *                     tournament_id:
 *                       type: string
 *                       format: uuid
 *                       description: ID del torneo
 *                     amount:
 *                       type: string
 *                       description: Monto pagado
 *                     chips_received:
 *                       type: integer
 *                       description: Fichas recibidas
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                       description: Fecha y hora de la recompra
 *                     admin_user_id:
 *                       type: string
 *                       format: uuid
 *                       description: ID del administrador que registró la recompra
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permisos de administrador
 *       404:
 *         description: Jugador no encontrado
 *       409:
 *         description: Máximo de recompras alcanzado
 */

/**
 * @swagger
 * /api/players/{playerId}/rebuys:
 *   get:
 *     summary: Obtener historial de recompras de un jugador
 *     tags: [Recompras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: playerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del jugador
 *     responses:
 *       200:
 *         description: Lista de recompras del jugador
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 rebuys:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                         description: ID de la recompra
 *                       player_id:
 *                         type: string
 *                         format: uuid
 *                         description: ID del jugador
 *                       tournament_id:
 *                         type: string
 *                         format: uuid
 *                         description: ID del torneo
 *                       amount:
 *                         type: string
 *                         description: Monto pagado
 *                       chips_received:
 *                         type: integer
 *                         description: Fichas recibidas
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                         description: Fecha y hora de la recompra
 *                       admin_user_id:
 *                         type: string
 *                         format: uuid
 *                         description: ID del administrador que registró la recompra
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Jugador no encontrado
 */
router.post('/players/:playerId/rebuys',
  authenticateToken,
  [
    param('playerId').isUUID().withMessage('Player ID debe ser un UUID válido'),
    body('amount').isNumeric().withMessage('Amount debe ser un número válido'),
    body('chips_received').isInt({ min: 1 }).withMessage('Chips received debe ser un número entero positivo'),
    body('admin_user_id').isUUID().withMessage('Admin user ID debe ser un UUID válido')
  ],
  async (req, res, next) => {
    try {
      console.log('🔍 Rebuy endpoint called:', {
        playerId: req.params.playerId,
        body: req.body,
        user: req.user?.id,
        headers: {
          authorization: req.headers.authorization ? 'PRESENT' : 'MISSING',
          'content-type': req.headers['content-type']
        }
      });

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('❌ Validation errors:', errors.array());
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Datos de entrada inválidos',
          details: errors.array()
        });
      }

      const { playerId } = req.params;
      const { amount, chips_received, admin_user_id } = req.body;

      console.log('✅ Validation passed, processing rebuy:', {
        playerId,
        amount,
        chips_received,
        admin_user_id,
        userId: req.user?.id
      });

      // Verificar que el usuario sea administrador
      if (!req.profile?.is_admin) {
        console.log('❌ User is not admin:', {
          userId: req.user?.id,
          profile: req.profile,
          isAdmin: req.profile?.is_admin
        });
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Solo los administradores pueden registrar recompras'
        });
      }

      // Verificar que el admin_user_id coincida con el usuario autenticado
      if (admin_user_id !== req.user?.id) {
        console.log('❌ Admin user ID mismatch:', {
          expected: req.user?.id,
          received: admin_user_id
        });
        return res.status(403).json({
          error: 'Forbidden',
          message: 'El ID de administrador no coincide con el usuario autenticado'
        });
      }

      // Obtener información del jugador con su torneo
      const { data: player, error: playerError } = await supabase
        .from('tournament_players')
        .select(`
          *,
          tournaments (
            id,
            name,
            max_rebuys,
            entry_fee,
            rebuy_chips
          )
        `)
        .eq('id', playerId)
        .single();

      if (playerError || !player) {
        return res.status(404).json({
          error: 'Player Not Found',
          message: 'Jugador no encontrado'
        });
      }

      // Verificar que el torneo existe
      if (!player.tournaments) {
        return res.status(404).json({
          error: 'Tournament Not Found',
          message: 'Torneo del jugador no encontrado'
        });
      }

      // Verificar que el jugador esté activo
      if (!player.is_active || player.is_eliminated) {
        return res.status(400).json({
          error: 'Player Not Active',
          message: 'Solo jugadores activos pueden hacer recompras'
        });
      }

      // Contar recompras existentes en este torneo
      const { count: rebuyCount } = await supabase
        .from('rebuys')
        .select('id', { count: 'exact' })
        .eq('player_id', playerId)
        .eq('tournament_id', player.tournament_id);

      if (rebuyCount >= player.tournaments.max_rebuys) {
        return res.status(400).json({
          error: 'Max Rebuys Reached',
          message: `Máximo de ${player.tournaments.max_rebuys} recompras alcanzado`
        });
      }

      // Registrar recompra
      const { data: newRebuy, error: rebuyError } = await supabase
        .from('rebuys')
        .insert({
          player_id: playerId,
          tournament_id: player.tournament_id,
          amount,
          chips_received,
          admin_user_id,
          timestamp: new Date().toISOString()
        })
        .select()
        .single();

      if (rebuyError) {
        console.error('Error registrando recompra:', rebuyError);
        throw rebuyError;
      }

      // Actualizar fichas del jugador
      const { error: updateError } = await supabase
        .from('tournament_players')
        .update({
          current_chips: player.current_chips + chips_received
        })
        .eq('id', playerId);

      if (updateError) {
        console.error('Error actualizando fichas:', updateError);
        throw updateError;
      }

      res.status(201).json({
        message: 'Recompra registrada exitosamente',
        rebuy: newRebuy
      });

    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/tournaments/{tournamentId}/rebuys:
 *   get:
 *     summary: Obtener todas las recompras de un torneo
 *     tags: [Recompras]
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
 *         description: Lista de todas las recompras del torneo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 rebuys:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                         description: ID de la recompra
 *                       player_id:
 *                         type: string
 *                         format: uuid
 *                         description: ID del jugador
 *                       tournament_id:
 *                         type: string
 *                         format: uuid
 *                         description: ID del torneo
 *                       amount:
 *                         type: string
 *                         description: Monto pagado
 *                       chips_received:
 *                         type: integer
 *                         description: Fichas recibidas
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                         description: Fecha y hora de la recompra
 *                       admin_user_id:
 *                         type: string
 *                         format: uuid
 *                         description: ID del administrador que registró la recompra
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Torneo no encontrado
 */

/**
 * @swagger
 * /api/players/{playerId}/rebuys:
 *   get:
 *     summary: Obtener recompras de un jugador
 *     tags: [Rebuys]
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
 *         description: Lista de recompras del jugador
 */
// Endpoint para obtener todas las rebuys de un torneo
router.get('/tournaments/:tournamentId/rebuys',
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

      // Verificar que el torneo existe
      const { data: tournament, error: tournamentError } = await supabase
        .from('tournaments')
        .select('id, name')
        .eq('id', tournamentId)
        .single();

      if (tournamentError || !tournament) {
        return res.status(404).json({
          error: 'Tournament Not Found',
          message: 'Torneo no encontrado'
        });
      }

      // Obtener todas las recompras del torneo
      const { data: rebuys, error } = await supabase
        .from('rebuys')
        .select(`
          *,
          tournament_players (
            user_id,
            users:profiles (
              name,
              nickname
            )
          )
        `)
        .eq('tournament_id', tournamentId)
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('Error obteniendo recompras del torneo:', error);
        throw error;
      }

      res.json({
        message: 'Recompras del torneo obtenidas exitosamente',
        tournament: {
          id: tournament.id,
          name: tournament.name
        },
        rebuys: rebuys || []
      });

    } catch (error) {
      next(error);
    }
  }
);

// Endpoint para obtener recompras de un jugador específico
router.get('/players/:playerId/rebuys',
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

      const { data: rebuys, error } = await supabase
        .from('rebuys')
        .select('*')
        .eq('player_id', playerId)
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('Error obteniendo recompras:', error);
        throw error;
      }

      res.json({
        message: 'Recompras obtenidas exitosamente',
        rebuys: rebuys || []
      });

    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;

