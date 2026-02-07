const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const { supabase, supabaseAdmin } = require('../config/supabase');
const { parseUtcTimestamp } = require('../utils/dateUtils');
const router = express.Router();

/**
 * @swagger
 * /api/clock/state:
 *   get:
 *     summary: Obtener estado actual del reloj del torneo
 *     tags: [Reloj]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tournamentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del torneo
 *     responses:
 *       200:
 *         description: Estado del reloj obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TournamentClock'
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Torneo no encontrado
 */

/**
 * @swagger
 * /api/clock/pause:
 *   post:
 *     summary: Pausar el reloj del torneo
 *     tags: [Reloj]
 *     security:
 *       - bearerAuth: []
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
 *                 format: uuid
 *                 description: ID del torneo
 *     responses:
 *       200:
 *         description: Reloj pausado exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Torneo no encontrado
 */

/**
 * @swagger
 * /api/clock/resume:
 *   post:
 *     summary: Reanudar el reloj del torneo
 *     tags: [Reloj]
 *     security:
 *       - bearerAuth: []
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
 *                 format: uuid
 *                 description: ID del torneo
 *     responses:
 *       200:
 *         description: Reloj reanudado exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Torneo no encontrado
 */

/**
 * @swagger
 * /api/clock/next-level:
 *   post:
 *     summary: Avanzar al siguiente nivel del torneo
 *     tags: [Reloj]
 *     security:
 *       - bearerAuth: []
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
 *                 format: uuid
 *                 description: ID del torneo
 *     responses:
 *       200:
 *         description: Nivel avanzado exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Torneo no encontrado
 */

/**
 * @swagger
 * /api/clock/adjust:
 *   post:
 *     summary: Ajustar tiempo del reloj del torneo
 *     tags: [Reloj]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tournamentId
 *               - adjustment_seconds
 *             properties:
 *               tournamentId:
 *                 type: string
 *                 format: uuid
 *                 description: ID del torneo
 *               adjustment_seconds:
 *                 type: integer
 *                 description: Segundos a agregar (positivo) o quitar (negativo)
 *     responses:
 *       200:
 *         description: Tiempo ajustado exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Torneo no encontrado
 */

/**
 * @swagger
 * /api/clock/join:
 *   post:
 *     summary: Unirse al reloj del torneo como administrador
 *     tags: [Reloj]
 *     security:
 *       - bearerAuth: []
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
 *                 format: uuid
 *                 description: ID del torneo
 *     responses:
 *       200:
 *         description: Unido al reloj exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Torneo no encontrado
 */

/**
 * @swagger
 * /api/clock/sync:
 *   post:
 *     summary: Sincronizar estado del reloj manualmente
 *     tags: [Reloj]
 *     security:
 *       - bearerAuth: []
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
 *                 format: uuid
 *                 description: ID del torneo
 *     responses:
 *       200:
 *         description: Reloj sincronizado exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Torneo no encontrado
 */

/**
 * Función helper para obtener o crear el reloj del torneo
 * @param {string} tournamentId - ID del torneo
 * @returns {Object} El registro del reloj
 */
async function getOrCreateTournamentClock(tournamentId) {
  try {
    // Primero intentar obtener el reloj existente
    const { data: existingClock, error: fetchError } = await supabase
      .from('tournament_clocks')
      .select('*')
      .eq('tournament_id', tournamentId)
      .single();

    // Si existe, devolverlo
    if (existingClock && !fetchError) {
      return existingClock;
    }

    // Si no existe, obtener información del torneo para inicializar el reloj
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('blind_structure, name')
      .eq('id', tournamentId)
      .single();

    if (tournamentError || !tournament) {
      throw new Error('Torneo no encontrado');
    }

    // Valores por defecto
    let currentLevel = 1;
    let timeRemainingSeconds = 1200; // 20 minutos por defecto

    // Si tiene estructura de blinds, usar el primer nivel
    if (tournament.blind_structure && tournament.blind_structure.length > 0) {
      const firstLevel = tournament.blind_structure[0];
      timeRemainingSeconds = firstLevel.duration_minutes ? firstLevel.duration_minutes * 60 : 1200;
    }

    // Crear el registro del reloj
    const clockData = {
      tournament_id: tournamentId,
      current_level: currentLevel,
      time_remaining_seconds: timeRemainingSeconds,
      is_paused: false,
      total_pause_time_seconds: 0,
      last_updated: new Date().toISOString()
    };

    const { data: newClock, error: insertError } = await supabaseAdmin
      .from('tournament_clocks')
      .insert(clockData)
      .select()
      .single();

    if (insertError) {
      // Si el error es de conflicto (probablemente ya existe un reloj), intentar obtenerlo
      if (insertError.code === '23505' || insertError.message?.includes('duplicate')) {
        console.log('🔄 Reloj ya existe, obteniendo reloj existente...');
        const { data: existingClock, error: fetchError2 } = await supabase
          .from('tournament_clocks')
          .select('*')
          .eq('tournament_id', tournamentId)
          .single();
        
        if (existingClock && !fetchError2) {
          return existingClock;
        }
      }
      throw insertError;
    }

    console.log(`🆕 Reloj creado automáticamente para torneo: ${tournament.name} (${tournamentId})`);
    return newClock;

  } catch (error) {
    console.error('Error obteniendo/creando reloj del torneo:', error);
    throw error;
  }
}

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

/**
 * @swagger
 * /api/clock/tournaments/{tournamentId}/clock:
 *   get:
 *     summary: Obtener reloj de un torneo específico
 *     tags: [Reloj]
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
 *         description: Estado del reloj obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TournamentClock'
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Reloj no encontrado
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
      console.log('🕐 Backend: Obteniendo reloj para torneo:', tournamentId);

      try {
        // Usar la función que crea automáticamente el reloj si no existe
        const clockData = await getOrCreateTournamentClock(tournamentId);
        console.log('✅ Backend: Reloj obtenido/creado:', clockData ? 'Presente' : 'Faltante');
        
        // Calcular tiempo restante dinámicamente
        const now = new Date();
        const lastUpdated = parseUtcTimestamp(clockData.last_updated);
        let actualTimeRemaining = clockData.time_remaining_seconds;

        if (!clockData.is_paused) {
          const secondsElapsed = Math.floor((now - lastUpdated) / 1000);
          actualTimeRemaining = Math.max(0, clockData.time_remaining_seconds - secondsElapsed);
        }

        const clock = {
          ...clockData,
          time_remaining_seconds: actualTimeRemaining,
          server_timestamp: now.toISOString()
        };
        
        res.json({
          message: 'Reloj obtenido exitosamente',
          clock: clock
        });
      } catch (error) {
        console.error('❌ Backend: Error obteniendo/creando reloj:', error);
        res.json({
          message: 'Reloj no encontrado',
          clock: null
        });
      }

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
      console.log('⏸️ Backend: Toggle pause para torneo:', tournamentId);

      // Usar la función que crea automáticamente el reloj si no existe
      const clock = await getOrCreateTournamentClock(tournamentId);
      if (!clock) {
        return res.status(404).json({
          error: 'Clock Not Found',
          message: 'No se pudo crear o encontrar el reloj del torneo'
        });
      }

      const nowDate = new Date();
      const now = nowDate.toISOString();
      let updateData = {};

      if (!clock.is_paused) {
        // Pausando el reloj: congelar tiempo restante en DB
        const elapsedSinceLastUpdate = Math.max(0, Math.floor((nowDate.getTime() - parseUtcTimestamp(clock.last_updated).getTime()) / 1000));
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
          totalPause += Math.max(0, Math.floor((nowDate.getTime() - parseUtcTimestamp(clock.paused_at).getTime()) / 1000));
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

      // Obtener o crear el reloj del torneo
      console.log(`🔍 Obteniendo/creando reloj para torneo: ${tournamentId}`);
      const clockData = await getOrCreateTournamentClock(tournamentId);
      console.log(`✅ Reloj obtenido/creado exitosamente para torneo: ${tournamentId}`);

      // Calcular tiempo restante dinámicamente
      const now = new Date();
      const lastUpdated = parseUtcTimestamp(clockData.last_updated);
      let actualTimeRemaining = clockData.time_remaining_seconds;

      if (!clockData.is_paused) {
        const secondsElapsed = Math.floor((now - lastUpdated) / 1000);
        actualTimeRemaining = Math.max(0, clockData.time_remaining_seconds - secondsElapsed);
      }

      const clockState = {
        tournament_id: clockData.tournament_id,
        current_level: clockData.current_level,
        time_remaining_seconds: actualTimeRemaining,
        is_paused: clockData.is_paused,
        last_updated: clockData.last_updated,
        server_timestamp: now.toISOString()
      };
      console.log(`✅ Estado del reloj obtenido: ${tournamentId} (${clockState.is_paused ? 'PAUSADO' : 'ACTIVO'})`);

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
      
      // Manejar errores específicos
      if (error.message?.includes('duplicate') || error.code === '23505') {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Ya existe un reloj para este torneo'
        });
      }
      
      // Error genérico de base de datos
      if (error.message?.includes('database') || error.message?.includes('relation')) {
        return res.status(500).json({
          error: 'Database Error',
          message: 'Error de base de datos al acceder al torneo'
        });
      }
      
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

      // Obtener o crear el reloj del torneo
      const clockData = await getOrCreateTournamentClock(tournamentId);

      // Calcular tiempo restante dinámicamente
      const now = new Date();
      const lastUpdated = parseUtcTimestamp(clockData.last_updated);
      let actualTimeRemaining = clockData.time_remaining_seconds;

      if (!clockData.is_paused) {
        const secondsElapsed = Math.floor((now - lastUpdated) / 1000);
        actualTimeRemaining = Math.max(0, clockData.time_remaining_seconds - secondsElapsed);
      }

      const clockState = {
        tournament_id: clockData.tournament_id,
        current_level: clockData.current_level,
        time_remaining_seconds: actualTimeRemaining,
        is_paused: clockData.is_paused,
        last_updated: clockData.last_updated,
        server_timestamp: now.toISOString()
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
    body('tournamentId').isUUID().withMessage('Tournament ID debe ser un UUID válido'),
    body('currentTimeSeconds').optional().isInt({ min: 0 }).withMessage('currentTimeSeconds debe ser un número entero positivo')
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

      const { tournamentId, currentTimeSeconds } = req.body;

      console.log(`⏸️ Pausando reloj para torneo: ${tournamentId}${currentTimeSeconds !== undefined ? ` en ${currentTimeSeconds}s` : ''}`);

      // Obtener o crear el reloj del torneo
      const clock = await getOrCreateTournamentClock(tournamentId);

      // Preparar actualización del estado del reloj
      const now = new Date();
      const updateData = {
        is_paused: true,
        last_updated: now.toISOString()
      };

      // Recalcular tiempo restante basado en el tiempo transcurrido desde la última actualización
      if (clock && clock.last_updated && !clock.is_paused) {
        const lastUpdated = parseUtcTimestamp(clock.last_updated);
        const secondsElapsed = Math.floor((now - lastUpdated) / 1000);

        // Solo calcular si han pasado al menos 2 segundos (para evitar cálculos con el servicio automático)
        if (secondsElapsed >= 2) {
          // Calcular tiempo restante real
          const actualRemainingSeconds = Math.max(0, clock.time_remaining_seconds - secondsElapsed);
          updateData.time_remaining_seconds = actualRemainingSeconds;
          console.log(`⏱️ Tiempo recalculado: ${clock.time_remaining_seconds}s - ${secondsElapsed}s = ${actualRemainingSeconds}s`);
        } else {
          // Si no ha pasado suficiente tiempo, mantener el tiempo actual
          updateData.time_remaining_seconds = clock.time_remaining_seconds;
          console.log(`⏱️ Tiempo sin cambios significativos: manteniendo ${clock.time_remaining_seconds}s`);
        }
      } else if (currentTimeSeconds !== undefined) {
        // Si se proporciona tiempo específico, usarlo
        updateData.time_remaining_seconds = currentTimeSeconds;
        console.log(`⏱️ Usando tiempo proporcionado: ${currentTimeSeconds}s`);
      } else if (clock) {
        // Mantener el tiempo actual
        updateData.time_remaining_seconds = clock.time_remaining_seconds;
        console.log(`⏱️ Manteniendo tiempo actual: ${clock.time_remaining_seconds}s`);
      }

      // Actualizar estado del reloj
      const { error } = await supabaseAdmin
        .from('tournament_clocks')
        .update(updateData)
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
        is_paused: true,
        time_remaining_seconds: currentTimeSeconds
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
    body('tournamentId').isUUID().withMessage('Tournament ID debe ser un UUID válido'),
    body('currentTimeSeconds').optional().isInt({ min: 0 }).withMessage('currentTimeSeconds debe ser un número entero positivo')
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

      const { tournamentId, currentTimeSeconds } = req.body;
      const now = new Date();

      console.log(`▶️ Reanudando reloj para torneo: ${tournamentId}${currentTimeSeconds !== undefined ? ` en ${currentTimeSeconds}s` : ''}`);

      // Obtener o crear el reloj del torneo
      const clock = await getOrCreateTournamentClock(tournamentId);

      // Preparar actualización del estado del reloj
      const updateData = {
        is_paused: false,
        last_updated: now.toISOString()
      };

      // Si se proporciona el tiempo actual, actualizarlo también
      if (currentTimeSeconds !== undefined) {
        updateData.time_remaining_seconds = currentTimeSeconds;
        console.log(`⏱️ Estableciendo tiempo inicial: ${currentTimeSeconds}s`);
      } else {
        // Si no se proporciona tiempo, mantener el tiempo actual
        updateData.time_remaining_seconds = clock.time_remaining_seconds;
        console.log(`⏱️ Manteniendo tiempo actual: ${clock.time_remaining_seconds}s`);
      }

      // Actualizar estado del reloj
      const { error } = await supabaseAdmin
        .from('tournament_clocks')
        .update(updateData)
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
        is_paused: false,
        time_remaining_seconds: currentTimeSeconds
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

      // Obtener o crear el reloj del torneo
      const currentClock = await getOrCreateTournamentClock(tournamentId);

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

      // Determinar si mantener pausado: si es nivel anterior, mantener pausado
      const isGoingBack = newLevel < currentClock.current_level;
      const shouldPause = isGoingBack ? true : false;

      console.log(`📊 Cambio de nivel: ${currentClock.current_level} → ${newLevel}`);
      console.log(`⏸️ Mantener pausado: ${shouldPause} (nivel anterior: ${isGoingBack})`);

      // Actualizar nivel y tiempo del reloj
      const { error } = await supabaseAdmin
        .from('tournament_clocks')
        .update({
          current_level: newLevel,
          time_remaining_seconds: levelTime,
          is_paused: shouldPause, // Mantener pausado si es nivel anterior
          last_updated: new Date().toISOString()
        })
        .eq('tournament_id', tournamentId);

      if (error) {
        console.error('❌ Error cambiando nivel del reloj:', error);
        throw error;
      }

      console.log(`✅ Nivel del reloj cambiado exitosamente a ${newLevel} (${levelTime}s)`);
      console.log(`${shouldPause ? '⏸️ Reloj mantenido pausado' : '▶️ Reloj reanudado automáticamente'}`);

      res.status(200).json({
        success: true,
        message: shouldPause
          ? 'Nivel del reloj cambiado exitosamente - reloj mantenido pausado'
          : 'Nivel del reloj cambiado exitosamente',
        tournament_id: tournamentId,
        new_level: newLevel,
        new_time_seconds: levelTime,
        is_paused: shouldPause
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

      // Obtener o crear el reloj del torneo
      const clock = await getOrCreateTournamentClock(tournamentId);

      // Actualizar tiempo del reloj y reiniciar estado
      const { error } = await supabaseAdmin
        .from('tournament_clocks')
        .update({
          time_remaining_seconds: newSeconds,
          is_paused: false, // Asegurar que no esté pausado
          last_updated: new Date().toISOString(),
          paused_at: null // Limpiar timestamp de pausa
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

/**
 * @swagger
 * /api/tournaments/{tournamentId}/finish:
 *   post:
 *     summary: Finalizar un torneo
 *     tags: [Reloj]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tournamentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del torneo a finalizar
 *     responses:
 *       200:
 *         description: Torneo finalizado exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado (solo administradores)
 *       404:
 *         description: Torneo no encontrado
 */
router.post('/tournaments/:tournamentId/finish',
  authenticateToken,
  [param('tournamentId').isUUID().withMessage('Tournament ID debe ser un UUID válido')],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Datos de entrada inválidos', 
          details: errors.array() 
        });
      }

      const { tournamentId } = req.params;
      const userId = req.user.userId;

      console.log(`🏁 Finalizando torneo: ${tournamentId} por usuario: ${userId}`);

      // Verificar que el usuario es administrador
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        console.error('❌ Error obteniendo datos del usuario:', userError);
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      if (!user.is_admin) {
        console.log('❌ Usuario no es administrador, acceso denegado');
        return res.status(403).json({ error: 'Solo los administradores pueden finalizar torneos' });
      }

      // Verificar que el torneo existe
      const { data: tournament, error: tournamentError } = await supabase
        .from('tournaments')
        .select('id, name, status')
        .eq('id', tournamentId)
        .single();

      if (tournamentError || !tournament) {
        console.error('❌ Torneo no encontrado:', tournamentError);
        return res.status(404).json({ error: 'Torneo no encontrado' });
      }

      // Verificar que el torneo no esté ya finalizado
      if (tournament.status === 'finished') {
        return res.status(400).json({ error: 'El torneo ya está finalizado' });
      }

      // Finalizar el torneo
      const { error: updateError } = await supabase
        .from('tournaments')
        .update({ 
          status: 'finished',
          finished_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', tournamentId);

      if (updateError) {
        console.error('❌ Error finalizando torneo:', updateError);
        throw updateError;
      }

      // Pausar el reloj del torneo
      const { error: clockError } = await supabaseAdmin
        .from('tournament_clocks')
        .update({
          is_paused: true,
          paused_at: new Date().toISOString(),
          last_updated: new Date().toISOString()
        })
        .eq('tournament_id', tournamentId);

      if (clockError) {
        console.error('⚠️ Error pausando reloj (no crítico):', clockError);
      }

      console.log(`✅ Torneo ${tournament.name} finalizado exitosamente`);

      res.status(200).json({
        success: true,
        message: 'Torneo finalizado exitosamente',
        tournament: {
          id: tournament.id,
          name: tournament.name,
          status: 'finished',
          finished_at: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error finalizando torneo:', error);
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/tournaments/{tournamentId}/clock/reset:
 *   post:
 *     summary: Reiniciar el reloj del torneo al nivel actual con tiempo completo
 *     tags: [Clock]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tournamentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Reloj reiniciado exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado (solo administradores)
 *       404:
 *         description: Torneo no encontrado
 */
router.post('/tournaments/:tournamentId/clock/reset',
  authenticateToken,
  [param('tournamentId').isUUID().withMessage('Tournament ID debe ser un UUID válido')],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Datos de entrada inválidos', 
          details: errors.array() 
        });
      }

      const { tournamentId } = req.params;
      const userId = req.user.userId;

      console.log(`🔄 Reiniciando reloj del torneo: ${tournamentId} por usuario: ${userId}`);

      // Verificar que el usuario es administrador
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        console.error('❌ Error obteniendo datos del usuario:', userError);
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      if (!user.is_admin) {
        console.log('❌ Usuario no es administrador, acceso denegado');
        return res.status(403).json({ error: 'Solo los administradores pueden reiniciar relojes' });
      }

      // Obtener información del torneo y el reloj actual
      const { data: tournament, error: tournamentError } = await supabase
        .from('tournaments')
        .select('id, name, status, blind_structure')
        .eq('id', tournamentId)
        .single();

      if (tournamentError || !tournament) {
        console.error('❌ Torneo no encontrado:', tournamentError);
        return res.status(404).json({ error: 'Torneo no encontrado' });
      }

      // Obtener el reloj actual
      const { data: currentClock, error: clockError } = await supabase
        .from('tournament_clocks')
        .select('*')
        .eq('tournament_id', tournamentId)
        .single();

      if (clockError && clockError.code !== 'PGRST116') {
        console.error('❌ Error obteniendo reloj:', clockError);
        return res.status(500).json({ error: 'Error obteniendo reloj del torneo' });
      }

      // Determinar el nivel actual (usar el del reloj si existe, sino nivel 1)
      const currentLevel = currentClock ? currentClock.current_level : 1;

      // Obtener la duración del nivel actual
      let levelTime = 1200; // 20 minutos por defecto
      if (tournament.blind_structure && tournament.blind_structure.length >= currentLevel) {
        const levelData = tournament.blind_structure[currentLevel - 1];
        levelTime = (levelData.duration_minutes || 20) * 60;
      }

      console.log(`🕐 Reiniciando reloj: Nivel ${currentLevel}, ${levelTime}s (${levelTime/60} minutos)`);

      // Actualizar o crear el reloj con los valores correctos
      const { data: updatedClock, error: updateError } = await supabaseAdmin
        .from('tournament_clocks')
        .upsert({
          tournament_id: tournamentId,
          current_level: currentLevel,
          time_remaining_seconds: levelTime,
          is_paused: currentClock ? currentClock.is_paused : true,
          total_pause_time_seconds: currentClock ? currentClock.total_pause_time_seconds : 0,
          last_updated: new Date().toISOString()
        }, {
          onConflict: 'tournament_id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (updateError) {
        console.error('❌ Error reiniciando reloj:', updateError);
        throw updateError;
      }

      console.log(`✅ Reloj del torneo ${tournament.name} reiniciado exitosamente`);

      res.status(200).json({
        success: true,
        message: 'Reloj reiniciado exitosamente',
        clock: updatedClock
      });

    } catch (error) {
      console.error('Error reiniciando reloj:', error);
      next(error);
    }
  }
);

module.exports = router;

