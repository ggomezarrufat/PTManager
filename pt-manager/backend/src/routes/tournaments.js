const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { supabase, supabaseAdmin } = require('../config/supabase');
const { authenticateToken, optionalAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/tournaments:
 *   get:
 *     summary: Obtener lista de torneos
 *     tags: [Torneos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, active, paused, finished]
 *         description: Filtrar por estado
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Lista de torneos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tournaments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Tournament'
 */
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const offset = (page - 1) * limit;


    let query = supabase
      .from('tournaments')
      .select('*', { count: 'exact' });

    // Filtrar por estado si se proporciona
    if (status) {
      query = query.eq('status', status);
    }

    // Lógica de permisos para torneos
    if (req.profile) {
      // Si el usuario es admin, mostrar todos los torneos
      if (req.profile.role === 'admin') {
        // Los admins ven todos los torneos
        console.log('🔍 Tournaments: Usuario admin, mostrando todos los torneos');
      } else {
        // Usuarios normales ven todos los torneos públicos
        console.log('🔍 Tournaments: Usuario normal, mostrando todos los torneos públicos');
      }
      // No filtrar por created_by para que todos vean todos los torneos
    } else {
      // Si no está autenticado, mostrar todos los torneos públicos
      console.log('🔍 Tournaments: Usuario no autenticado, mostrando todos los torneos públicos');
    }

    console.log('🔍 Tournaments: Ejecutando query con parámetros:', {
      page,
      limit,
      status,
      offset,
      hasProfile: !!req.profile,
      profileId: req.profile?.id,
      profileIsAdmin: req.profile?.is_admin,
      profileEmail: req.profile?.email
    });

    const { data: tournaments, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    console.log('📊 Tournaments: Resultado de la query:', {
      hasData: !!tournaments,
      count: tournaments?.length || 0,
      totalCount: count,
      error: error ? error.message : null
    });

    if (error) {
      throw error;
    }

    res.json({
      tournaments: tournaments || [],
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/tournaments/{id}:
 *   get:
 *     summary: Obtener torneo por ID
 *     tags: [Torneos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Información del torneo
 *       404:
 *         description: Torneo no encontrado
 */
router.get('/:id', [
  param('id').isUUID().withMessage('ID debe ser un UUID válido')
], optionalAuth, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        details: errors.array()
      });
    }

    const { id } = req.params;


    const { data: tournament, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !tournament) {
      return res.status(404).json({
        error: 'Tournament Not Found',
        message: 'Torneo no encontrado'
      });
    }

    res.json({ tournament });

  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/tournaments:
 *   post:
 *     summary: Crear nuevo torneo
 *     tags: [Torneos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - max_players
 *               - entry_fee
 *               - initial_chips
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               max_players:
 *                 type: integer
 *                 minimum: 2
 *               entry_fee:
 *                 type: number
 *                 minimum: 0
 *               initial_chips:
 *                 type: integer
 *                 minimum: 1
 *               scheduled_start_time:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Torneo creado exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 */
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const {
      name,
      description,
      entry_fee,
      max_players,
      scheduled_start_time,
      initial_chips,
      rebuy_chips,
      addon_chips,
      max_rebuys,
      max_addons,
      blind_structure,
      point_system,
      season_id
    } = req.body;

    // Validaciones básicas
    if (!name || !entry_fee || !scheduled_start_time || !initial_chips || !rebuy_chips || !addon_chips || !blind_structure || !point_system) {
      return res.status(400).json({
        error: 'Missing required fields: name, entry_fee, scheduled_start_time, initial_chips, rebuy_chips, addon_chips, blind_structure, point_system'
      });
    }

    // Validar que la temporada existe si se proporciona
    if (season_id) {
      const { data: season, error: seasonError } = await supabase
        .from('seasons')
        .select('id')
        .eq('id', season_id)
        .single();

      if (seasonError || !season) {
        return res.status(400).json({
          error: 'Invalid season_id: season not found'
        });
      }
    }

    const tournamentData = {
      name,
      description,
      entry_fee,
      max_players: max_players || 100,
      scheduled_start_time,
      initial_chips,
      rebuy_chips,
      addon_chips,
      max_rebuys: max_rebuys || 3,
      max_addons: max_addons || 1,
      blind_structure,
      point_system,
      created_by: req.profile.id,
      season_id
    };

    // Usar cliente admin para evitar problemas de RLS al crear
    const client = supabaseAdmin || supabase;
    const { data: tournament, error } = await client
      .from('tournaments')
      .insert(tournamentData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({
      message: 'Torneo creado exitosamente',
      tournament
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/tournaments/{id}/start:
 *   put:
 *     summary: Iniciar torneo
 *     tags: [Torneos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Torneo iniciado exitosamente
 *       404:
 *         description: Torneo no encontrado
 *       400:
 *         description: No se puede iniciar el torneo
 */
router.put('/:id/start', [
  param('id').isUUID().withMessage('ID debe ser un UUID válido')
], authenticateToken, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        details: errors.array()
      });
    }

    const { id } = req.params;

    // Verificar que el torneo existe y puede ser iniciado
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', id)
      .single();

    if (tournamentError || !tournament) {
      return res.status(404).json({
        error: 'Tournament Not Found',
        message: 'Torneo no encontrado'
      });
    }

    if (tournament.status !== 'scheduled') {
      return res.status(400).json({
        error: 'Invalid Tournament Status',
        message: 'Solo se pueden iniciar torneos programados'
      });
    }

    // Actualizar estado del torneo
    const { data: updatedTournament, error: updateError } = await supabase
      .from('tournaments')
      .update({
        status: 'active',
        actual_start_time: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Crear reloj del torneo si tiene estructura de blinds
    if (tournament.blind_structure && tournament.blind_structure.length > 0) {
      const firstLevel = tournament.blind_structure[0];
      const initialTimeSeconds = firstLevel.duration_minutes * 60;

      await supabase
        .from('tournament_clocks')
        .insert({
          tournament_id: id,
          current_level: 1,
          time_remaining_seconds: initialTimeSeconds,
          is_paused: true,
          total_pause_time_seconds: 0,
          last_updated: new Date().toISOString()
        });
    }

    res.json({
      message: 'Torneo iniciado exitosamente',
      tournament: updatedTournament
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/tournaments/{id}/finish:
 *   put:
 *     summary: Finalizar torneo
 *     tags: [Torneos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Torneo finalizado exitosamente
 *       404:
 *         description: Torneo no encontrado
 *       400:
 *         description: No se puede finalizar el torneo
 */
router.put('/:id/finish', [
  param('id').isUUID().withMessage('ID debe ser un UUID válido')
], authenticateToken, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        details: errors.array()
      });
    }

    const { id } = req.params;

    // Verificar que el torneo existe y puede ser finalizado
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', id)
      .single();

    if (tournamentError || !tournament) {
      return res.status(404).json({
        error: 'Tournament Not Found',
        message: 'Torneo no encontrado'
      });
    }

    if (!['active', 'paused'].includes(tournament.status)) {
      return res.status(400).json({
        error: 'Invalid Tournament Status',
        message: 'Solo se pueden finalizar torneos activos o pausados'
      });
    }

    // Actualizar estado del torneo
    const { data: updatedTournament, error: updateError } = await supabase
      .from('tournaments')
      .update({
        status: 'finished',
        end_time: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    res.json({
      message: 'Torneo finalizado exitosamente',
      tournament: updatedTournament
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/tournaments/{id}/pause:
 *   put:
 *     summary: Pausar torneo
 *     tags: [Torneos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Torneo pausado exitosamente
 */
router.put('/:id/pause', [
  param('id').isUUID().withMessage('ID debe ser un UUID válido')
], authenticateToken, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        details: errors.array()
      });
    }

    const { id } = req.params;

    const { data: updatedTournament, error } = await supabase
      .from('tournaments')
      .update({ status: 'paused' })
      .eq('id', id)
      .eq('status', 'active')
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({
      message: 'Torneo pausado exitosamente',
      tournament: updatedTournament
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/tournaments/{id}/resume:
 *   put:
 *     summary: Reanudar torneo
 *     tags: [Torneos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Torneo reanudado exitosamente
 */
router.put('/:id/resume', [
  param('id').isUUID().withMessage('ID debe ser un UUID válido')
], authenticateToken, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        details: errors.array()
      });
    }

    const { id } = req.params;

    const { data: updatedTournament, error } = await supabase
      .from('tournaments')
      .update({ status: 'active' })
      .eq('id', id)
      .eq('status', 'paused')
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({
      message: 'Torneo reanudado exitosamente',
      tournament: updatedTournament
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/tournaments/{id}:
 *   delete:
 *     summary: Eliminar torneo y sus resultados
 *     tags: [Torneos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Torneo eliminado
 */
router.delete('/:id', [
  param('id').isUUID().withMessage('ID debe ser un UUID válido')
], authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        details: errors.array()
      });
    }

    const { id } = req.params;

    // Borrar dependencias: players, rebuys, addons, clock
    await supabase.from('rebuys').delete().in('player_id',
      (await supabase.from('tournament_players').select('id').eq('tournament_id', id)).data?.map(p => p.id) || []
    );
    await supabase.from('addons').delete().in('player_id',
      (await supabase.from('tournament_players').select('id').eq('tournament_id', id)).data?.map(p => p.id) || []
    );
    await supabase.from('tournament_players').delete().eq('tournament_id', id);
    await supabase.from('tournament_clocks').delete().eq('tournament_id', id);

    const { error } = await supabase.from('tournaments').delete().eq('id', id);
    if (error) throw error;

    res.json({ message: 'Torneo eliminado exitosamente' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
