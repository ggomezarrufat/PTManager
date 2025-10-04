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
 *     summary: Registrar nuevo addon para un jugador
 *     tags: [Addons]
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
 *                 description: Cantidad pagada por el addon
 *               chips_received:
 *                 type: integer
 *                 minimum: 1
 *                 description: Fichas recibidas por el addon
 *               admin_user_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID del administrador que registra el addon
 *     responses:
 *       201:
 *         description: Addon registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 addon:
 *                   $ref: '#/components/schemas/Addon'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permisos de administrador
 *       404:
 *         description: Jugador no encontrado
 *       409:
 *         description: Máximo de addons alcanzado
 */

/**
 * @swagger
 * /api/players/{playerId}/addons:
 *   get:
 *     summary: Obtener historial de addons de un jugador
 *     tags: [Addons]
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
 *         description: Lista de addons del jugador
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 addons:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Addon'
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Jugador no encontrado
 */
router.post('/players/:playerId/addons',
  authenticateToken,
  [
    param('playerId').isUUID().withMessage('Player ID debe ser un UUID válido'),
    body('amount').isNumeric().withMessage('Amount debe ser un número válido'),
    body('chips_received').isInt({ min: 1 }).withMessage('Chips received debe ser un número entero positivo'),
    body('admin_user_id').isUUID().withMessage('Admin user ID debe ser un UUID válido')
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
      const { amount, chips_received, admin_user_id } = req.body;

      // Verificar que el usuario sea administrador
      if (!req.profile?.is_admin) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Solo los administradores pueden registrar addons'
        });
      }

      // Verificar que el admin_user_id coincida con el usuario autenticado
      if (admin_user_id !== req.user?.id) {
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
            max_addons,
            entry_fee,
            addon_chips
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

      // Verificar que el jugador esté activo y no eliminado
      if (!player.is_active || player.is_eliminated) {
        return res.status(400).json({
          error: 'Player Not Active',
          message: 'Solo jugadores activos y no eliminados pueden hacer addons'
        });
      }

      // Contar addons existentes en este torneo
      const { count: addonCount } = await supabase
        .from('addons')
        .select('id', { count: 'exact' })
        .eq('player_id', playerId)
        .eq('tournament_id', player.tournament_id);

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
          admin_user_id,
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

/**
 * @swagger
 * /api/tournaments/{tournamentId}/addons:
 *   get:
 *     summary: Obtener todas los addons de un torneo
 *     tags: [Addons]
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
 *         description: Lista de addons del torneo obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 addons:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Addon'
 *                 tournament:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     name:
 *                       type: string
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Torneo no encontrado
 */

/**
 * @swagger
 * /api/players/{playerId}/addons:
 *   get:
 *     summary: Obtener addons de un jugador específico
 *     tags: [Addons]
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
 *         description: Lista de addons del jugador obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 addons:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Addon'
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Jugador no encontrado
 */
// Endpoint para obtener todas los addons de un torneo
router.get('/tournaments/:tournamentId/addons',
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

      // Obtener todos los addons del torneo
      const { data: addons, error } = await supabase
        .from('addons')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('Error obteniendo addons del torneo:', error);
        throw error;
      }

      res.json({
        message: 'Addons del torneo obtenidos exitosamente',
        tournament: {
          id: tournament.id,
          name: tournament.name
        },
        addons: addons || []
      });

    } catch (error) {
      next(error);
    }
  }
);

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

