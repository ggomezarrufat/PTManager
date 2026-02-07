const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { supabase, supabaseAdmin } = require('../config/supabase');
const router = express.Router();

/**
 * @swagger
 * /api/tournaments/{tournamentId}/players:
 *   get:
 *     summary: Obtener lista de jugadores de un torneo
 *     tags: [Jugadores]
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
 *                 tournament:
 *                   $ref: '#/components/schemas/Tournament'
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Torneo no encontrado
 *   post:
 *     summary: Agregar jugador a un torneo
 *     tags: [Jugadores]
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
 *                 format: uuid
 *                 description: ID del usuario a agregar
 *               entry_fee_paid:
 *                 type: number
 *                 description: Entry fee pagado por el jugador
 *               initial_chips:
 *                 type: integer
 *                 description: Fichas iniciales del jugador
 *     responses:
 *       201:
 *         description: Jugador agregado exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Torneo o usuario no encontrado
 *       409:
 *         description: El usuario ya está registrado en este torneo
 */

/**
 * @swagger
 * /api/players/{playerId}:
 *   delete:
 *     summary: Desregistrar jugador del torneo (eliminar inscripción)
 *     tags: [Jugadores]
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
 *         description: Jugador desregistrado exitosamente
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Jugador no encontrado
 */

/**
 * @swagger
 * /api/players/{playerId}/check:
 *   get:
 *     summary: Verificar si un jugador existe
 *     tags: [Jugadores]
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
 *         description: Jugador encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 player:
 *                   $ref: '#/components/schemas/TournamentPlayer'
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Jugador no encontrado
 */

/**
 * @swagger
 * /api/players/{playerId}/eliminate:
 *   put:
 *     summary: Eliminar jugador del torneo con cálculo automático de posición y puntos
 *     description: Marca al jugador como eliminado. Calcula automáticamente posición y puntos si no se proporcionan. Solo administradores.
 *     tags: [Jugadores]
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
 *               - tournament_id
 *             properties:
 *               tournament_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID del torneo (requerido para validación)
 *               final_position:
 *                 type: integer
 *                 minimum: 1
 *                 description: Posición final (opcional, se calcula automáticamente)
 *               points_earned:
 *                 type: integer
 *                 minimum: 0
 *                 description: Puntos obtenidos (opcional, se calcula automáticamente)
 *               eliminated_by:
 *                 type: string
 *                 format: uuid
 *                 description: ID del administrador que elimina al jugador
 *     responses:
 *       200:
 *         description: Jugador eliminado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Jugador eliminado exitosamente
 *                 player:
 *                   $ref: '#/components/schemas/TournamentPlayer'
 *                 calculated_values:
 *                   type: object
 *                   properties:
 *                     calculated_position:
 *                       type: integer
 *                       description: Posición calculada automáticamente
 *                     calculated_points:
 *                       type: integer
 *                       description: Puntos calculados automáticamente
 *                     total_players:
 *                       type: integer
 *                       description: Total de jugadores en el torneo
 *                     eliminated_count:
 *                       type: integer
 *                       description: Cantidad de jugadores ya eliminados
 *       400:
 *         description: Datos inválidos o jugador ya eliminado
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Solo administradores pueden eliminar jugadores
 *       404:
 *         description: Jugador no encontrado en el torneo especificado
 */

/**
 * @swagger
 * /api/players/{playerId}/results:
 *   put:
 *     summary: Actualizar resultados de un jugador (posición final y puntos)
 *     description: Actualiza posición final y/o puntos. Si se establece posición final, el jugador se marca como eliminado. Solo administradores.
 *     tags: [Jugadores]
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
 *             properties:
 *               final_position:
 *                 type: integer
 *                 minimum: 1
 *                 description: Posición final en el torneo
 *               points_earned:
 *                 type: integer
 *                 minimum: 0
 *                 description: Puntos ganados por el jugador
 *     responses:
 *       200:
 *         description: Resultados actualizados exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Solo administradores
 *       404:
 *         description: Jugador no encontrado
 */

/**
 * @swagger
 * /api/tournaments/{tournamentId}/results:
 *   put:
 *     summary: Actualizar en bloque resultados de un torneo finalizado
 *     description: Permite actualizar posición y puntos de múltiples jugadores a la vez. Solo administradores.
 *     tags: [Jugadores]
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
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - player_id
 *                   properties:
 *                     player_id:
 *                       type: string
 *                       format: uuid
 *                       description: ID del jugador
 *                     final_position:
 *                       type: integer
 *                       minimum: 1
 *                       description: Posición final del jugador
 *                     points_earned:
 *                       type: integer
 *                       minimum: 0
 *                       description: Puntos ganados
 *     responses:
 *       200:
 *         description: Resultados actualizados exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Solo administradores
 *       404:
 *         description: Torneo no encontrado
 */

/**
 * @swagger
 * /api/players/{playerId}/chips:
 *   put:
 *     summary: Actualizar fichas de un jugador
 *     description: Establece la cantidad de fichas actuales del jugador. Solo administradores.
 *     tags: [Jugadores]
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
 *               - current_chips
 *             properties:
 *               current_chips:
 *                 type: integer
 *                 minimum: 0
 *                 description: Nueva cantidad de fichas
 *     responses:
 *       200:
 *         description: Fichas actualizadas exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Solo administradores
 *       404:
 *         description: Jugador no encontrado
 */

/**
 * @swagger
 * /api/players/{playerId}/position-points:
 *   put:
 *     summary: Actualizar posición y puntos de un jugador en torneo finalizado
 *     description: Permite editar posición final y puntos de un jugador en un torneo que ya terminó. Solo administradores.
 *     tags: [Jugadores]
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
 *               - final_position
 *               - points_earned
 *               - updated_by
 *             properties:
 *               final_position:
 *                 type: integer
 *                 minimum: 1
 *                 description: Posición final del jugador
 *               points_earned:
 *                 type: integer
 *                 minimum: 0
 *                 description: Puntos ganados
 *               updated_by:
 *                 type: string
 *                 format: uuid
 *                 description: ID del administrador que actualiza
 *     responses:
 *       200:
 *         description: Posición y puntos actualizados exitosamente
 *       400:
 *         description: Datos inválidos o torneo no finalizado
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Solo administradores
 *       404:
 *         description: Jugador o torneo no encontrado
 */

/**
 * @swagger
 * /api/players/{playerId}/confirm-registration:
 *   put:
 *     summary: Confirmar inscripción de un jugador
 *     description: Confirma la inscripción asignando fichas iniciales y activando al jugador. Solo administradores.
 *     tags: [Jugadores]
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
 *               - initial_chips
 *               - admin_user_id
 *             properties:
 *               initial_chips:
 *                 type: integer
 *                 minimum: 0
 *                 description: Fichas iniciales del jugador
 *               admin_user_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID del administrador que confirma
 *     responses:
 *       200:
 *         description: Inscripción confirmada exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Solo administradores
 *       404:
 *         description: Jugador no encontrado
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
      console.log('📋 Backend: Obteniendo jugadores del torneo:', tournamentId);

      // 1) Obtener jugadores (sin joins para evitar dependencia de FK)
      const { data: players, error: playersError } = await supabase
        .from('tournament_players')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('registration_time', { ascending: true });

      console.log('📋 Backend: Jugadores encontrados:', players?.length || 0);

      if (playersError) {
        console.error('Error obteniendo jugadores:', playersError);
        throw playersError;
      }

      const userIds = (players || []).map(p => p.user_id).filter(Boolean);
      const playerIds = (players || []).map(p => p.id).filter(Boolean);

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

      // 3) Obtener contadores de recompras y addons
      let rebuysCountByPlayerId = {};
      let addonsCountByPlayerId = {};

      if (playerIds.length > 0) {
        // Contar recompras por jugador
        const { data: rebuysData, error: rebuysError } = await supabase
          .from('rebuys')
          .select('player_id')
          .in('player_id', playerIds);

        if (rebuysError) {
          console.error('Error obteniendo recompras:', rebuysError);
          throw rebuysError;
        }

        // Agrupar por player_id
        rebuysCountByPlayerId = (rebuysData || []).reduce((acc, rebuy) => {
          acc[rebuy.player_id] = (acc[rebuy.player_id] || 0) + 1;
          return acc;
        }, {});

        // Contar addons por jugador
        const { data: addonsData, error: addonsError } = await supabase
          .from('addons')
          .select('player_id')
          .in('player_id', playerIds);

        if (addonsError) {
          console.error('Error obteniendo addons:', addonsError);
          throw addonsError;
        }

        // Agrupar por player_id
        addonsCountByPlayerId = (addonsData || []).reduce((acc, addon) => {
          acc[addon.player_id] = (acc[addon.player_id] || 0) + 1;
          return acc;
        }, {});
      }

      // 4) Fusionar datos
      const formattedPlayers = (players || []).map(player => ({
        ...player,
        user: profilesById[player.user_id] || null,
        rebuys_count: rebuysCountByPlayerId[player.id] || 0,
        addons_count: addonsCountByPlayerId[player.id] || 0
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
      console.log('🗑️ Backend: Eliminando jugador con ID:', playerId);

      // Verificar que el jugador existe antes de eliminar
      const { data: existingPlayer, error: checkError } = await supabase
        .from('tournament_players')
        .select('id, tournament_id, user_id')
        .eq('id', playerId)
        .single();

      if (checkError || !existingPlayer) {
        console.log('❌ Backend: Jugador no encontrado:', playerId);
        return res.status(404).json({
          error: 'Player not found',
          message: 'Jugador no encontrado'
        });
      }

      console.log('✅ Backend: Jugador encontrado, eliminando:', existingPlayer);

      const { error } = await supabase
        .from('tournament_players')
        .delete()
        .eq('id', playerId);

      if (error) {
        console.error('❌ Backend: Error desregistrando jugador:', error);
        throw error;
      }

      console.log('✅ Backend: Jugador eliminado exitosamente');
      res.json({ message: 'Jugador desregistrado exitosamente' });
    } catch (error) {
      next(error);
    }
  }
);

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

router.get('/players/:playerId/check',
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

      const { data: player, error } = await supabase
        .from('tournament_players')
        .select('id, user_id, tournament_id, is_active, is_eliminated')
        .eq('id', playerId)
        .single();

      if (error || !player) {
        return res.status(404).json({
          error: 'Player not found',
          message: 'Jugador no encontrado'
        });
      }

      res.json({
        message: 'Jugador encontrado',
        player: player
      });

    } catch (error) {
      next(error);
    }
  }
);

const eliminatePlayerHandler = [
  authenticateToken,
  [
    param('playerId').isUUID().withMessage('Player ID debe ser un UUID válido'),
    body('tournament_id').isUUID().withMessage('Tournament ID debe ser un UUID válido'),
    body('final_position').optional().isInt({ min: 1 }).withMessage('Final position debe ser un número entero positivo'),
    body('points_earned').optional().isInt({ min: 0 }).withMessage('Points earned debe ser un número entero no negativo'),
    body('eliminated_by').optional().isUUID().withMessage('Eliminated by debe ser un UUID válido')
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
      const { tournament_id, final_position, points_earned, eliminated_by } = req.body;

      console.log('🏁 Backend: Eliminando jugador:', {
        playerId,
        tournament_id,
        final_position,
        points_earned,
        eliminated_by
      });

      // Verificar que el usuario sea administrador
      if (!req.profile?.is_admin) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Solo los administradores pueden eliminar jugadores'
        });
      }

      // Verificar que el eliminated_by coincida con el usuario autenticado
      if (eliminated_by && eliminated_by !== req.user?.id) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'El ID de administrador no coincide con el usuario autenticado'
        });
      }

      // Diagnóstico: buscar con ambos clientes para detectar si es RLS
      const dbClient = supabaseAdmin || supabase;
      const { data: playerData, error: playerError } = await dbClient
        .from('tournament_players')
        .select('id, user_id, tournament_id, final_position')
        .eq('id', playerId)
        .eq('tournament_id', tournament_id)
        .maybeSingle();

      // Si no se encuentra por id, intentar por user_id
      let resolvedPlayer = playerData;
      let usedUserIdFallback = false;
      if (!playerData && !playerError) {
        const { data: byUserId } = await dbClient
          .from('tournament_players')
          .select('id, user_id, tournament_id, final_position')
          .eq('user_id', playerId)
          .eq('tournament_id', tournament_id)
          .maybeSingle();

        console.log('🔍 Búsqueda por id falló, buscando por user_id:', {
          playerId,
          tournament_id,
          foundById: false,
          foundByUserId: !!byUserId,
          result: byUserId ? { id: byUserId.id, user_id: byUserId.user_id } : null
        });

        if (byUserId) {
          resolvedPlayer = byUserId;
          usedUserIdFallback = true;
        }
      } else {
        console.log('🔍 Resultado búsqueda jugador por id:', {
          playerId,
          tournament_id,
          found: !!playerData,
          error: playerError?.message || null
        });
      }

      if (playerError) {
        console.error('❌ Error en consulta de jugador:', playerError);
        return res.status(500).json({
          error: 'Database Error',
          message: 'Error al consultar el jugador en la base de datos',
          details: playerError.message
        });
      }

      if (!resolvedPlayer) {
        // Listar todos los jugadores del torneo para diagnóstico
        const { data: allPlayers } = await dbClient
          .from('tournament_players')
          .select('id, user_id')
          .eq('tournament_id', tournament_id)
          .limit(20);

        console.log('❌ Jugador no encontrado. Jugadores en el torneo:', {
          playerId,
          tournament_id,
          totalInTournament: allPlayers?.length || 0,
          players: allPlayers?.map(p => ({ id: p.id, user_id: p.user_id })) || []
        });

        return res.status(404).json({
          error: 'Player not found',
          message: `Jugador ${playerId} no encontrado en el torneo ${tournament_id}`
        });
      }

      // Si se usó fallback por user_id, actualizar playerId para las queries subsiguientes
      const resolvedPlayerId = usedUserIdFallback ? resolvedPlayer.id : playerId;

      // Verificar si el jugador ya está eliminado
      if (resolvedPlayer.final_position) {
        return res.status(400).json({
          error: 'Player already eliminated',
          message: 'El jugador ya ha sido eliminado'
        });
      }

      // Obtener estadísticas del torneo para calcular posición y puntos
      const tournamentId = resolvedPlayer.tournament_id;

      // Contar total de jugadores en el torneo
      const { count: totalPlayers, error: totalError } = await supabase
        .from('tournament_players')
        .select('id', { count: 'exact', head: true })
        .eq('tournament_id', tournamentId);

      if (totalError) {
        console.error('Error counting total players:', totalError);
        throw totalError;
      }

      // Contar jugadores ya eliminados
      const { count: eliminatedPlayers, error: eliminatedError } = await supabase
        .from('tournament_players')
        .select('id', { count: 'exact', head: true })
        .eq('tournament_id', tournamentId)
        .not('final_position', 'is', null);

      if (eliminatedError) {
        console.error('Error counting eliminated players:', eliminatedError);
        throw eliminatedError;
      }

      // Calcular valores automáticamente
      const calculatedPosition = totalPlayers - eliminatedPlayers;
      const calculatedPoints = eliminatedPlayers + 1;

      // Usar valores proporcionados o calculados
      const finalPosition = final_position || calculatedPosition;
      const pointsEarned = points_earned || calculatedPoints;

      const updateData = {
        is_active: false,
        is_eliminated: true,
        eliminated_at: new Date().toISOString(),
        final_position: finalPosition,
        points_earned: pointsEarned
      };

      if (eliminated_by) {
        updateData.eliminated_by = eliminated_by;
      }

      if (usedUserIdFallback) {
        console.log('⚠️ Se usó user_id como fallback. Frontend envió:', playerId, '-> real id:', resolvedPlayerId);
      }

      const { data: updatedPlayer, error } = await dbClient
        .from('tournament_players')
        .update(updateData)
        .eq('id', resolvedPlayerId)
        .select()
        .single();

      if (error) {
        console.error('Error eliminando jugador:', error);
        throw error;
      }

      res.json({
        message: 'Jugador eliminado exitosamente',
        player: updatedPlayer,
        calculated_values: {
          calculated_position: calculatedPosition,
          calculated_points: calculatedPoints,
          total_players: totalPlayers,
          eliminated_count: eliminatedPlayers
        }
      });

    } catch (error) {
      next(error);
    }
  }
];

router.put('/players/:playerId/eliminate', ...eliminatePlayerHandler);
router.put('/players/:playerId/eliminate/', ...eliminatePlayerHandler);
router.post('/players/:playerId/eliminate', ...eliminatePlayerHandler);
router.post('/players/:playerId/eliminate/', ...eliminatePlayerHandler);

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

router.put('/players/:playerId/chips',
  authenticateToken,
  requireAdmin,
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

router.put('/players/:playerId/position-points',
  authenticateToken,
  requireAdmin,
  [
    param('playerId').isUUID().withMessage('Player ID debe ser un UUID válido'),
    body('final_position').isInt({ min: 1 }).withMessage('Final position debe ser un entero positivo'),
    body('points_earned').isInt({ min: 0 }).withMessage('Points earned debe ser un entero no negativo'),
    body('updated_by').isUUID().withMessage('Updated by debe ser un UUID válido')
  ],
  async (req, res, next) => {
    try {
      console.log('🔍 [position-points] Iniciando actualización:', {
        playerId: req.params.playerId,
        body: req.body,
        user: req.user
      });

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('❌ [position-points] Errores de validación:', errors.array());
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Datos de entrada inválidos',
          details: errors.array()
        });
      }

      const { playerId } = req.params;
      const { final_position, points_earned, updated_by } = req.body;

      console.log('🔍 [position-points] Datos extraídos:', {
        playerId,
        final_position,
        points_earned,
        updated_by
      });

      // Verificar que el updated_by coincida con el usuario autenticado
      if (updated_by !== req.user?.id) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'El ID de administrador no coincide con el usuario autenticado'
        });
      }

      // Verificar que el jugador existe y obtener información del torneo
      console.log('🔍 [position-points] Buscando jugador:', playerId);
      const { data: playerData, error: playerError } = await supabase
        .from('tournament_players')
        .select('tournament_id, is_eliminated')
        .eq('id', playerId)
        .single();

      console.log('🔍 [position-points] Resultado búsqueda jugador:', {
        playerData,
        playerError
      });

      if (playerError || !playerData) {
        console.log('❌ [position-points] Jugador no encontrado:', playerError);
        return res.status(404).json({
          error: 'Player not found',
          message: 'Jugador no encontrado'
        });
      }

      // Verificar que el torneo esté finalizado
      console.log('🔍 [position-points] Buscando torneo:', playerData.tournament_id);
      const { data: tournament, error: tournamentError } = await supabase
        .from('tournaments')
        .select('status')
        .eq('id', playerData.tournament_id)
        .single();

      console.log('🔍 [position-points] Resultado búsqueda torneo:', {
        tournament,
        tournamentError
      });

      if (tournamentError || !tournament) {
        console.log('❌ [position-points] Torneo no encontrado:', tournamentError);
        return res.status(404).json({
          error: 'Tournament not found',
          message: 'Torneo no encontrado'
        });
      }

      if (tournament.status !== 'finished') {
        console.log('❌ [position-points] Torneo no finalizado:', tournament.status);
        return res.status(400).json({
          error: 'Invalid Tournament Status',
          message: 'Solo se pueden editar posiciones y puntos en torneos finalizados'
        });
      }

      // Actualizar posición y puntos del jugador
      console.log('🔍 [position-points] Actualizando jugador:', {
        playerId,
        final_position,
        points_earned
      });

      const { data: updatedPlayer, error } = await supabase
        .from('tournament_players')
        .update({
          final_position,
          points_earned,
          updated_at: new Date().toISOString()
        })
        .eq('id', playerId)
        .select()
        .single();

      console.log('🔍 [position-points] Resultado actualización:', {
        updatedPlayer,
        error
      });

      if (error) {
        console.error('❌ [position-points] Error actualizando posición y puntos:', error);
        throw error;
      }

      console.log('✅ [position-points] Actualización exitosa');
      res.json({
        message: 'Posición y puntos actualizados exitosamente',
        player: updatedPlayer
      });

    } catch (error) {
      console.error('❌ [position-points] Error general:', error);
      next(error);
    }
  }
);

router.put('/players/:playerId/confirm-registration',
  authenticateToken,
  requireAdmin,
  [
    param('playerId').isUUID().withMessage('Player ID debe ser un UUID válido'),
    body('initial_chips').isInt({ min: 0 }).withMessage('Initial chips debe ser un número entero no negativo'),
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
      const { initial_chips, admin_user_id } = req.body;

      // Verificar que el admin_user_id coincida con el usuario autenticado
      if (admin_user_id !== req.user?.id) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'El ID de administrador no coincide con el usuario autenticado'
        });
      }

      const { data: updatedPlayer, error } = await supabase
        .from('tournament_players')
        .update({
          current_chips: initial_chips,
          is_active: true,
          registration_confirmed_by: admin_user_id
        })
        .eq('id', playerId)
        .select()
        .single();

      if (error) {
        console.error('Error confirmando inscripción:', error);
        throw error;
      }

      res.json({
        message: 'Inscripción confirmada exitosamente',
        player: updatedPlayer
      });

    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;

