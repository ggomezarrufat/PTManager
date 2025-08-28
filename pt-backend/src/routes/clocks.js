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

/**
 * @swagger
 * /api/tournaments/{tournamentId}/clock/initialize:
 *   post:
 *     summary: Inicializar reloj del torneo
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
 *         description: Reloj inicializado exitosamente
 *       400:
 *         description: Error de validación
 *       403:
 *         description: No autorizado (solo admins)
 */
router.post('/tournaments/:tournamentId/clock/initialize',
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
      const { user } = req;

      // Verificar que el usuario es admin
      if (!user.is_admin) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Solo los administradores pueden inicializar relojes'
        });
      }

      // Verificar que el torneo existe y está activo
      const { data: tournament, error: tournamentError } = await supabase
        .from('tournaments')
        .select('id, status, blind_structure')
        .eq('id', tournamentId)
        .single();

      if (tournamentError || !tournament) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Torneo no encontrado'
        });
      }

      if (tournament.status !== 'active') {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Solo se pueden inicializar relojes para torneos activos'
        });
      }

      // Obtener duración del primer nivel
      let initialTime = 1200; // 20 minutos por defecto
      if (tournament.blind_structure && tournament.blind_structure.length > 0) {
        const firstLevel = tournament.blind_structure[0];
        initialTime = (firstLevel.duration_minutes || 20) * 60;
      }

      // Crear o actualizar el reloj
      const { data: clock, error: clockError } = await supabase
        .from('tournament_clocks')
        .upsert({
          tournament_id: tournamentId,
          current_level: 1,
          time_remaining_seconds: initialTime,
          is_paused: false,
          last_updated: new Date().toISOString()
        }, {
          onConflict: 'tournament_id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (clockError) {
        console.error('Error inicializando reloj:', clockError);
        throw clockError;
      }

      console.log(`🕐 Reloj inicializado para torneo ${tournamentId} - Nivel 1, ${initialTime}s`);

      res.json({
        message: 'Reloj inicializado exitosamente',
        clock: clock
      });

    } catch (error) {
      next(error);
    }
  }
);

// Nuevas rutas para compatibilidad con polling HTTP (Vercel)

/**
 * @swagger
 * /api/clock/join:
 *   post:
 *     summary: Unirse a un torneo y obtener estado inicial del reloj
 *     tags: [Clock]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tournamentId
 *               - userId
 *             properties:
 *               tournamentId:
 *                 type: string
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Unido al torneo exitosamente
 */
router.post('/clock/join',
  [
    body('tournamentId').isUUID().withMessage('Tournament ID debe ser un UUID válido'),
    body('userId').isString().notEmpty().withMessage('User ID es requerido')
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

      const { tournamentId, userId } = req.body;

      console.log(`👥 Usuario ${userId} intentando unirse al torneo ${tournamentId}`);

      // Verificar que el usuario tiene acceso al torneo
      const { data: tournament, error: tournamentError } = await supabase
        .from('tournaments')
        .select('id, status, name')
        .eq('id', tournamentId)
        .single();

      if (tournamentError || !tournament) {
        console.error('Error obteniendo torneo:', tournamentError);
        return res.status(404).json({ error: 'Torneo no encontrado' });
      }

      if (tournament.status !== 'active') {
        return res.status(400).json({ error: 'El torneo no está activo' });
      }

      // Obtener estado actual del reloj
      const { data: clockData, error: clockError } = await supabase
        .from('tournament_clocks')
        .select('*')
        .eq('tournament_id', tournamentId)
        .single();

      let clockState = null;
      if (!clockError && clockData) {
        clockState = {
          tournament_id: clockData.tournament_id,
          current_level: clockData.current_level,
          time_remaining_seconds: clockData.time_remaining_seconds,
          is_paused: clockData.is_paused,
          last_updated: clockData.last_updated
        };
        console.log(`✅ Estado del reloj obtenido: ${tournamentId} (${clockState.is_paused ? 'PAUSADO' : 'ACTIVO'})`);
      } else {
        console.log(`❌ No se pudo encontrar reloj para torneo: ${tournamentId}`);
      }

      console.log(`✅ Usuario ${userId} se unió exitosamente al torneo ${tournament.name}`);

      res.status(200).json({
        success: true,
        tournament: {
          id: tournament.id,
          name: tournament.name,
          status: tournament.status
        },
        clockState: clockState
      });

    } catch (error) {
      console.error('Error en join-tournament:', error);
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/clock/state:
 *   get:
 *     summary: Obtener estado actual del reloj
 *     tags: [Clock]
 *     parameters:
 *       - in: query
 *         name: tournamentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Estado del reloj obtenido exitosamente
 */
router.get('/clock/state',
  async (req, res, next) => {
    try {
      const { tournamentId } = req.query;

      if (!tournamentId) {
        return res.status(400).json({
          error: 'Tournament ID es requerido'
        });
      }

      console.log(`🔍 Consultando estado del reloj para torneo: ${tournamentId}`);

      // Obtener estado actual del reloj
      const { data: clockData, error: clockError } = await supabase
        .from('tournament_clocks')
        .select('*')
        .eq('tournament_id', tournamentId)
        .single();

      if (clockError) {
        if (clockError.code === 'PGRST116') {
          // No encontrado
          return res.status(404).json({
            error: 'Reloj no encontrado para este torneo'
          });
        }
        console.error('Error obteniendo reloj:', clockError);
        return res.status(500).json({
          error: 'Error obteniendo estado del reloj',
          details: clockError.message
        });
      }

      if (!clockData) {
        return res.status(404).json({
          error: 'No hay reloj configurado para este torneo'
        });
      }

      const clockState = {
        tournament_id: clockData.tournament_id,
        current_level: clockData.current_level,
        time_remaining_seconds: clockData.time_remaining_seconds,
        is_paused: clockData.is_paused,
        last_updated: clockData.last_updated
      };

      console.log(`📤 Estado del reloj enviado: ${clockState.time_remaining_seconds}s (nivel ${clockState.current_level})`);

      res.status(200).json({
        success: true,
        clockState: clockState
      });

    } catch (error) {
      console.error('Error obteniendo estado del reloj:', error);
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/clock/pause:
 *   post:
 *     summary: Pausar reloj del torneo
 *     tags: [Clock]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tournamentId
 *             properties:
 *               tournamentId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reloj pausado exitosamente
 */
router.post('/clock/pause',
  [
    body('tournamentId').isUUID().withMessage('Tournament ID debe ser un UUID válido')
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

      const { tournamentId } = req.body;

      console.log(`⏸️ Pausando reloj para torneo: ${tournamentId}`);

      // Actualizar estado del reloj
      const { error } = await supabase
        .from('tournament_clocks')
        .update({
          is_paused: true,
          last_updated: new Date().toISOString()
        })
        .eq('tournament_id', tournamentId);

      if (error) {
        console.error('❌ Error pausando reloj:', error);
        throw error;
      }

      console.log(`✅ Reloj pausado exitosamente: ${tournamentId}`);

      res.status(200).json({
        success: true,
        message: 'Reloj pausado exitosamente',
        tournament_id: tournamentId,
        is_paused: true
      });

    } catch (error) {
      console.error('Error en pause-clock:', error);
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/clock/resume:
 *   post:
 *     summary: Reanudar reloj del torneo
 *     tags: [Clock]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tournamentId
 *             properties:
 *               tournamentId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reloj reanudado exitosamente
 */
router.post('/clock/resume',
  [
    body('tournamentId').isUUID().withMessage('Tournament ID debe ser un UUID válido')
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

      const { tournamentId } = req.body;

      console.log(`▶️ Reanudando reloj para torneo: ${tournamentId}`);

      // Actualizar estado del reloj
      const { error } = await supabase
        .from('tournament_clocks')
        .update({
          is_paused: false,
          last_updated: new Date().toISOString()
        })
        .eq('tournament_id', tournamentId);

      if (error) {
        console.error('❌ Error reanudando reloj:', error);
        throw error;
      }

      console.log(`✅ Reloj reanudado exitosamente: ${tournamentId}`);

      res.status(200).json({
        success: true,
        message: 'Reloj reanudado exitosamente',
        tournament_id: tournamentId,
        is_paused: false
      });

    } catch (error) {
      console.error('Error en resume-clock:', error);
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/clock/level:
 *   post:
 *     summary: Cambiar nivel del reloj
 *     tags: [Clock]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tournamentId
 *               - newLevel
 *             properties:
 *               tournamentId:
 *                 type: string
 *               newLevel:
 *                 type: number
 *     responses:
 *       200:
 *         description: Nivel del reloj cambiado exitosamente
 */
router.post('/clock/level',
  [
    body('tournamentId').isUUID().withMessage('Tournament ID debe ser un UUID válido'),
    body('newLevel').isInt({ min: 1 }).withMessage('newLevel debe ser un número entero positivo')
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

      const { tournamentId, newLevel } = req.body;

      console.log(`🔄 Cambiando nivel del reloj para torneo: ${tournamentId} a nivel ${newLevel}`);

      // Obtener información del torneo para determinar la duración del nuevo nivel
      const { data: tournament, error: tournamentError } = await supabase
        .from('tournaments')
        .select('blind_structure')
        .eq('id', tournamentId)
        .single();

      if (tournamentError || !tournament) {
        return res.status(404).json({
          error: 'Torneo no encontrado'
        });
      }

      // Calcular tiempo para el nuevo nivel
      let levelTime = 1200; // 20 minutos por defecto
      if (tournament.blind_structure && tournament.blind_structure.length >= newLevel) {
        const levelData = tournament.blind_structure[newLevel - 1]; // Array index starts at 0
        levelTime = (levelData.duration_minutes || 20) * 60;
      }

      // Actualizar nivel y tiempo del reloj
      const { error } = await supabase
        .from('tournament_clocks')
        .update({
          current_level: newLevel,
          time_remaining_seconds: levelTime,
          is_paused: false, // Reiniciar automáticamente cuando se cambia el nivel
          last_updated: new Date().toISOString()
        })
        .eq('tournament_id', tournamentId);

      if (error) {
        console.error('❌ Error cambiando nivel del reloj:', error);
        throw error;
      }

      console.log(`✅ Nivel del reloj cambiado exitosamente a ${newLevel} (${levelTime}s)`);

      res.status(200).json({
        success: true,
        message: 'Nivel del reloj cambiado exitosamente',
        tournament_id: tournamentId,
        new_level: newLevel,
        new_time_seconds: levelTime
      });

    } catch (error) {
      console.error('Error en change-level:', error);
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/clock/adjust:
 *   post:
 *     summary: Ajustar tiempo del reloj
 *     tags: [Clock]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tournamentId
 *               - newSeconds
 *             properties:
 *               tournamentId:
 *                 type: string
 *               newSeconds:
 *                 type: number
 *     responses:
 *       200:
 *         description: Tiempo del reloj ajustado exitosamente
 */
router.post('/clock/adjust',
  [
    body('tournamentId').isUUID().withMessage('Tournament ID debe ser un UUID válido'),
    body('newSeconds').isInt({ min: 0 }).withMessage('newSeconds debe ser un número entero no negativo')
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

      const { tournamentId, newSeconds } = req.body;

      console.log(`🔄 Ajustando tiempo del reloj para torneo: ${tournamentId} a ${newSeconds} segundos`);

      // Actualizar tiempo del reloj
      const { error } = await supabase
        .from('tournament_clocks')
        .update({
          time_remaining_seconds: newSeconds,
          last_updated: new Date().toISOString()
        })
        .eq('tournament_id', tournamentId);

      if (error) {
        console.error('❌ Error ajustando tiempo del reloj:', error);
        throw error;
      }

      console.log(`✅ Tiempo del reloj ajustado exitosamente a ${newSeconds} segundos`);

      res.status(200).json({
        success: true,
        message: 'Tiempo del reloj ajustado exitosamente',
        tournament_id: tournamentId,
        new_time_seconds: newSeconds
      });

    } catch (error) {
      console.error('Error en adjust-time:', error);
      next(error);
    }
  }
);

module.exports = router;

