const express = require('express');
const { supabase } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Season:
 *       type: object
 *       required:
 *         - name
 *         - start_date
 *         - end_date
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único de la temporada
 *         name:
 *           type: string
 *           description: Nombre de la temporada
 *         start_date:
 *           type: string
 *           format: date
 *           description: Fecha de inicio de la temporada
 *         end_date:
 *           type: string
 *           format: date
 *           description: Fecha de fin de la temporada
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *         created_by:
 *           type: string
 *           format: uuid
 */

/**
 * @swagger
 * /api/seasons:
 *   get:
 *     summary: Obtener todas las temporadas
 *     tags: [Seasons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Número de elementos por página
 *     responses:
 *       200:
 *         description: Lista de temporadas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 seasons:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Season'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 */
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    // Obtener temporadas con paginación
    const { data: seasons, error: seasonsError, count } = await supabase
      .from('seasons')
      .select('*', { count: 'exact' })
      .order('start_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (seasonsError) {
      console.error('Error fetching seasons:', seasonsError);
      throw seasonsError;
    }

    // Obtener el total de temporadas
    const total = count || 0;
    const pages = Math.ceil(total / limit);

    res.json({
      seasons: seasons || [],
      pagination: {
        page,
        limit,
        total,
        pages
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/seasons/{id}:
 *   get:
 *     summary: Obtener una temporada por ID
 *     tags: [Seasons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la temporada
 *     responses:
 *       200:
 *         description: Temporada encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Season'
 *       404:
 *         description: Temporada no encontrada
 */
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: season, error } = await supabase
      .from('seasons')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Season not found' });
      }
      throw error;
    }

    res.json(season);

  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/seasons:
 *   post:
 *     summary: Crear una nueva temporada
 *     tags: [Seasons]
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
 *               - start_date
 *               - end_date
 *             properties:
 *               name:
 *                 type: string
 *               start_date:
 *                 type: string
 *                 format: date
 *               end_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Temporada creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 season:
 *                   $ref: '#/components/schemas/Season'
 */
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { name, start_date, end_date } = req.body;

    // Validaciones básicas
    if (!name || !start_date || !end_date) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, start_date, end_date' 
      });
    }

    // Validar que la fecha de inicio sea anterior a la de fin
    if (new Date(start_date) >= new Date(end_date)) {
      return res.status(400).json({ 
        error: 'Start date must be before end date' 
      });
    }

    // Verificar que el usuario sea admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', req.user.id)
      .single();

    if (profileError || !profile?.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Crear la temporada
    const { data: season, error: createError } = await supabase
      .from('seasons')
      .insert({
        name,
        start_date,
        end_date,
        created_by: req.user.id
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating season:', createError);
      throw createError;
    }

    res.status(201).json({
      message: 'Season created successfully',
      season
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/seasons/{id}:
 *   put:
 *     summary: Actualizar una temporada
 *     tags: [Seasons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la temporada
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               start_date:
 *                 type: string
 *                 format: date
 *               end_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Temporada actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 season:
 *                   $ref: '#/components/schemas/Season'
 *       404:
 *         description: Temporada no encontrada
 */
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, start_date, end_date } = req.body;

    // Verificar que el usuario sea admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', req.user.id)
      .single();

    if (profileError || !profile?.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Validar que la fecha de inicio sea anterior a la de fin si se proporcionan ambas
    if (start_date && end_date && new Date(start_date) >= new Date(end_date)) {
      return res.status(400).json({ 
        error: 'Start date must be before end date' 
      });
    }

    // Actualizar la temporada
    const { data: season, error: updateError } = await supabase
      .from('seasons')
      .update({
        name,
        start_date,
        end_date,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Season not found' });
      }
      throw updateError;
    }

    res.json({
      message: 'Season updated successfully',
      season
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/seasons/{id}:
 *   delete:
 *     summary: Eliminar una temporada
 *     tags: [Seasons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la temporada
 *     responses:
 *       200:
 *         description: Temporada eliminada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Temporada no encontrada
 */
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verificar que el usuario sea admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', req.user.id)
      .single();

    if (profileError || !profile?.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Verificar si hay torneos asociados a esta temporada
    const { data: tournaments, error: tournamentsError } = await supabase
      .from('tournaments')
      .select('id, name')
      .eq('season_id', id);

    if (tournamentsError) {
      throw tournamentsError;
    }

    if (tournaments && tournaments.length > 0) {
      return res.status(400).json({
        error: 'Cannot delete season with associated tournaments',
        tournaments: tournaments.map(t => ({ id: t.id, name: t.name }))
      });
    }

    // Eliminar la temporada
    const { error: deleteError } = await supabase
      .from('seasons')
      .delete()
      .eq('id', id);

    if (deleteError) {
      if (deleteError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Season not found' });
      }
      throw deleteError;
    }

    res.json({
      message: 'Season deleted successfully'
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;

