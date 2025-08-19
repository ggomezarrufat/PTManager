const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const { supabase } = require('../config/supabase');
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Addon:
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
 * /api/players/{playerId}/addons:
 *   post:
 *     summary: Registrar addon para un jugador
 *     tags: [Addons]
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
 *         description: Addon registrado exitosamente
 */
router.post('/players/:playerId/addons',
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

      // Verificar que el jugador esté activo y no eliminado
      if (!player.is_active || player.is_eliminated) {
        return res.status(400).json({
          error: 'Player Not Active',
          message: 'Solo jugadores activos y no eliminados pueden hacer addons'
        });
      }

      // Contar addons existentes
      const { count: addonCount } = await supabase
        .from('addons')
        .select('id', { count: 'exact' })
        .eq('player_id', playerId);

      if (addonCount >= player.tournaments.max_addons) {
        return res.status(400).json({
          error: 'Max Addons Reached',
          message: `Máximo de ${player.tournaments.max_addons} addons alcanzado`
        });
      }

      // Registrar addon
      const { data: newAddon, error: addonError } = await supabase
        .from('addons')
        .insert({
          player_id: playerId,
          tournament_id: player.tournament_id,
          amount,
          chips_received,
          timestamp: new Date().toISOString()
        })
        .select()
        .single();

      if (addonError) {
        console.error('Error registrando addon:', addonError);
        throw addonError;
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
        message: 'Addon registrado exitosamente',
        addon: newAddon
      });

    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/players/{playerId}/addons:
 *   get:
 *     summary: Obtener addons de un jugador
 *     tags: [Addons]
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
 *         description: Lista de addons del jugador
 */
router.get('/players/:playerId/addons',
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

      const { data: addons, error } = await supabase
        .from('addons')
        .select('*')
        .eq('player_id', playerId)
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('Error obteniendo addons:', error);
        throw error;
      }

      res.json({
        message: 'Addons obtenidos exitosamente',
        addons: addons || []
      });

    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;

