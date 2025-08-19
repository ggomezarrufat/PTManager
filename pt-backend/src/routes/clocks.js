const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const { supabase } = require('../config/supabase');
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     TournamentClock:
 *       type: object
 *       properties:
 *         tournament_id:
 *           type: string
 *         current_level:
 *           type: number
 *         time_remaining_seconds:
 *           type: number
 *         is_paused:
 *           type: boolean
 *         paused_at:
 *           type: string
 *         total_pause_time_seconds:
 *           type: number
 *         last_updated:
 *           type: string
 */

/**
 * @swagger
 * /api/tournaments/{tournamentId}/clock:
 *   get:
 *     summary: Obtener reloj del torneo
 *     tags: [Clock]
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
 *         description: Reloj del torneo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 clock:
 *                   $ref: '#/components/schemas/TournamentClock'
 */
router.get('/tournaments/:tournamentId/clock',
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

      const { data: clock, error } = await supabase
        .from('tournament_clocks')
        .select('*')
        .eq('tournament_id', tournamentId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = No rows returned
        console.error('Error obteniendo reloj:', error);
        throw error;
      }

      res.json({
        message: clock ? 'Reloj obtenido exitosamente' : 'Reloj no encontrado',
        clock: clock || null
      });

    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/tournaments/{tournamentId}/clock:
 *   post:
 *     summary: Crear reloj del torneo
 *     tags: [Clock]
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
 *               - initial_time_seconds
 *             properties:
 *               initial_time_seconds:
 *                 type: number
 *     responses:
 *       201:
 *         description: Reloj creado exitosamente
 */
router.post('/tournaments/:tournamentId/clock',
  authenticateToken,
  [
    param('tournamentId').isUUID().withMessage('Tournament ID debe ser un UUID válido'),
    body('initial_time_seconds').isInt({ min: 1 }).withMessage('Initial time debe ser un número entero positivo')
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
      const { initial_time_seconds } = req.body;

      // Verificar que el torneo existe
      const { data: tournament, error: tournamentError } = await supabase
        .from('tournaments')
        .select('id')
        .eq('id', tournamentId)
        .single();

      if (tournamentError || !tournament) {
        return res.status(404).json({
          error: 'Tournament Not Found',
          message: 'Torneo no encontrado'
        });
      }

      // Crear reloj
      const { data: newClock, error: clockError } = await supabase
        .from('tournament_clocks')
        .insert({
          tournament_id: tournamentId,
          current_level: 1,
          time_remaining_seconds: initial_time_seconds,
          is_paused: false,
          total_pause_time_seconds: 0,
          last_updated: new Date().toISOString()
        })
        .select()
        .single();

      if (clockError) {
        console.error('Error creando reloj:', clockError);
        throw clockError;
      }

      res.status(201).json({
        message: 'Reloj creado exitosamente',
        clock: newClock
      });

    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/tournaments/{tournamentId}/clock/toggle-pause:
 *   put:
 *     summary: Pausar/reanudar reloj del torneo
 *     tags: [Clock]
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
 *         description: Estado del reloj actualizado exitosamente
 */
router.put('/tournaments/:tournamentId/clock/toggle-pause',
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

      // Obtener reloj actual
      const { data: clock, error: clockError } = await supabase
        .from('tournament_clocks')
        .select('*')
        .eq('tournament_id', tournamentId)
        .single();

      if (clockError || !clock) {
        return res.status(404).json({
          error: 'Clock Not Found',
          message: 'Reloj del torneo no encontrado'
        });
      }

      const nowDate = new Date();
      const now = nowDate.toISOString();
      let updateData = {};

      if (!clock.is_paused) {
        // Pausando el reloj: congelar tiempo restante en DB
        const elapsedSinceLastUpdate = Math.max(0, Math.floor((nowDate.getTime() - new Date(clock.last_updated).getTime()) / 1000));
        const newRemaining = Math.max(0, (clock.time_remaining_seconds || 0) - elapsedSinceLastUpdate);
        updateData = {
          is_paused: true,
          paused_at: now,
          last_updated: now,
          time_remaining_seconds: newRemaining
        };
      } else {
        // Reanudando el reloj: mantener tiempo restante y ajustar tiempo total de pausa
        let totalPause = clock.total_pause_time_seconds || 0;
        if (clock.paused_at) {
          totalPause += Math.max(0, Math.floor((nowDate.getTime() - new Date(clock.paused_at).getTime()) / 1000));
        }
        updateData = {
          is_paused: false,
          paused_at: null,
          last_updated: now,
          total_pause_time_seconds: totalPause
        };
      }

      // Log de depuración en reanudar
      if (updateData.is_paused === false) {
        console.log('▶️ Reanudar reloj (backend)', {
          now,
          last_updated_prev: clock.last_updated,
          time_remaining_seconds_prev: clock.time_remaining_seconds,
          paused_at_prev: clock.paused_at,
          total_pause_time_seconds_prev: clock.total_pause_time_seconds,
          updateData
        });
      }

      const { data: updatedClock, error: updateError } = await supabase
        .from('tournament_clocks')
        .update(updateData)
        .eq('tournament_id', tournamentId)
        .select()
        .single();

      if (updateError) {
        console.error('Error actualizando reloj:', updateError);
        throw updateError;
      }

      res.json({
        message: `Reloj ${updatedClock.is_paused ? 'pausado' : 'reanudado'} exitosamente`,
        clock: updatedClock
      });

    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/tournaments/{tournamentId}/clock:
 *   put:
 *     summary: Actualizar reloj del torneo
 *     tags: [Clock]
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
 *             properties:
 *               current_level:
 *                 type: number
 *               time_remaining_seconds:
 *                 type: number
 *     responses:
 *       200:
 *         description: Reloj actualizado exitosamente
 */
router.put('/tournaments/:tournamentId/clock',
  authenticateToken,
  [
    param('tournamentId').isUUID().withMessage('Tournament ID debe ser un UUID válido'),
    body('current_level').optional().isInt({ min: 1 }).withMessage('Current level debe ser un número entero positivo'),
    body('time_remaining_seconds').optional().isInt({ min: 0 }).withMessage('Time remaining debe ser un número entero no negativo'),
    body('is_paused').optional().isBoolean().withMessage('is_paused debe ser booleano')
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
      const now = new Date().toISOString();
      const updateData = { ...req.body, last_updated: now };

      // Si se cambia el nivel o se resetea el tiempo, arrancar el reloj inmediatamente
      if (typeof req.body.current_level !== 'undefined' || typeof req.body.time_remaining_seconds !== 'undefined') {
        updateData.is_paused = false;
        updateData.paused_at = null;
      }

      const { data: updatedClock, error } = await supabase
        .from('tournament_clocks')
        .update(updateData)
        .eq('tournament_id', tournamentId)
        .select()
        .single();

      if (error) {
        console.error('Error actualizando reloj:', error);
        throw error;
      }

      res.json({
        message: 'Reloj actualizado exitosamente',
        clock: updatedClock
      });

    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;

