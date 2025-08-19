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
 *         player_id:
 *           type: string
 *         tournament_id:
 *           type: string
 *         amount:
 *           type: number
 *         chips_received:
 *           type: number
 *         timestamp:
 *           type: string
 */

/**
 * @swagger
 * /api/players/{playerId}/rebuys:
 *   post:
 *     summary: Registrar recompra para un jugador
 *     tags: [Rebuys]
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
 *               - amount
 *               - chips_received
 *             properties:
 *               amount:
 *                 type: number
 *               chips_received:
 *                 type: number
 *     responses:
 *       201:
 *         description: Recompra registrada exitosamente
 */
router.post('/players/:playerId/rebuys',
  authenticateToken,
  [
    param('playerId').isUUID().withMessage('Player ID debe ser un UUID válido'),
    body('amount').isNumeric().withMessage('Amount debe ser un número válido'),
    body('chips_received').isInt({ min: 1 }).withMessage('Chips received debe ser un número entero positivo')
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
      const { amount, chips_received } = req.body;

      // Obtener información del jugador
      const { data: player, error: playerError } = await supabase
        .from('tournament_players')
        .select('*, tournaments(*)')
        .eq('id', playerId)
        .single();

      if (playerError || !player) {
        return res.status(404).json({
          error: 'Player Not Found',
          message: 'Jugador no encontrado'
        });
      }

      // Verificar que el jugador esté activo
      if (!player.is_active || player.is_eliminated) {
        return res.status(400).json({
          error: 'Player Not Active',
          message: 'Solo jugadores activos pueden hacer recompras'
        });
      }

      // Contar recompras existentes
      const { count: rebuyCount } = await supabase
        .from('rebuys')
        .select('id', { count: 'exact' })
        .eq('player_id', playerId);

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

