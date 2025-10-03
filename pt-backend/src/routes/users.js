const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { getSupabaseClient } = require('../config/supabase');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Obtener lista de usuarios (solo admins)
 *     tags: [Usuarios]
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
 *           default: 10
 *         description: Elementos por página
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nombre o email
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permisos de administrador
 */
/**
 * @swagger
 * /api/users/available-for-tournament:
 *   get:
 *     summary: Obtener usuarios disponibles para torneos
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios disponibles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         description: No autenticado
 */
// Endpoint para obtener usuarios disponibles para torneos (no requiere admin)
router.get('/available-for-tournament', authenticateToken, async (req, res, next) => {
  try {
    const supabase = getSupabaseClient();
    
    // Obtener todos los usuarios de la tabla profiles (sin filtros de confirmación de email)
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, name, nickname, email, is_admin, created_at')
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    console.log(`📋 Usuarios disponibles para torneo: ${users?.length || 0} usuarios obtenidos`);

    res.json({
      users: users || []
    });

  } catch (error) {
    console.error('❌ Error obteniendo usuarios para torneo:', error);
    next(error);
  }
});

router.get('/', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    const supabase = getSupabaseClient(true); // Usar cliente admin

    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' });

    // Aplicar filtro de búsqueda si existe
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,nickname.ilike.%${search}%`);
    }

    // Aplicar paginación y ordenamiento
    const { data: users, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    const totalPages = Math.ceil(count / limit);

    res.json({
      users: users || [],
      pagination: {
        page,
        limit,
        total: count,
        totalPages
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Crear nuevo usuario (solo admins)
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email del usuario
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: Contraseña del usuario
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 description: Nombre completo del usuario
 *               nickname:
 *                 type: string
 *                 description: Apodo del usuario (opcional)
 *               is_admin:
 *                 type: boolean
 *                 default: false
 *                 description: Si el usuario es administrador
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permisos de administrador
 *       409:
 *         description: Email ya existe
 */
router.post('/', [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('name').isLength({ min: 2 }).withMessage('El nombre debe tener al menos 2 caracteres'),
  body('nickname').optional().isLength({ min: 1 }).withMessage('El apodo debe tener al menos 1 carácter'),
  body('is_admin').optional().isBoolean().withMessage('is_admin debe ser un valor booleano')
], authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        details: errors.array()
      });
    }

    const { email, password, name, nickname, is_admin = false } = req.body;

    const supabase = getSupabaseClient(true); // Usar cliente admin

    // Verificación atómica: verificar email y crear perfil en una sola operación
    let existingProfile;
    try {
      // Usar una transacción para verificar y crear de forma atómica
      const { data: checkResult, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing profile:', checkError);
        return res.status(500).json({
          error: 'Database Error',
          message: 'Error al verificar usuario existente'
        });
      }

      if (checkResult) {
        return res.status(409).json({
          error: 'Email Already Exists',
          message: 'Ya existe un usuario con este email'
        });
      }

      existingProfile = checkResult;
    } catch (checkException) {
      console.error('Exception checking existing profile:', checkException);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Error al verificar usuario existente'
      });
    }

    // Verificar si el email ya existe en auth.users
    try {
      const { data: existingAuthUser, error: checkAuthError } = await supabase.auth.admin.listUsers();
      
      if (checkAuthError) {
        console.error('Error checking auth users:', checkAuthError);
      } else if (existingAuthUser.users.some(user => user.email === email)) {
        return res.status(409).json({
          error: 'Email Already Exists',
          message: 'Ya existe un usuario con este email en el sistema de autenticación'
        });
      }
    } catch (authCheckError) {
      console.error('Error checking auth users:', authCheckError);
      // Continuar con la creación si no podemos verificar
    }

    // Generar un UUID único usando JavaScript
    let uniqueId;
    try {
      // Usar crypto.randomUUID() si está disponible (Node.js 14.17+)
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        uniqueId = crypto.randomUUID();
      } else {
        // Fallback: generar UUID v4 manualmente
        uniqueId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      }
      
      console.log('Generated UUID:', uniqueId);
    } catch (uuidGenError) {
      console.error('Error in UUID generation:', uuidGenError);
      return res.status(500).json({
        error: 'System Error',
        message: 'Error al generar ID único del usuario'
      });
    }

    // Verificar que el UUID generado no exista ya en profiles
    const { data: existingIdProfile, error: checkIdError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', uniqueId)
      .maybeSingle();

    if (checkIdError) {
      console.error('Error checking existing ID:', checkIdError);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Error al verificar ID único del usuario'
      });
    }

    if (existingIdProfile) {
      console.error('Generated UUID already exists in profiles:', uniqueId);
      return res.status(500).json({
        error: 'System Error',
        message: 'Error interno del sistema: ID duplicado generado'
      });
    }

    // Crear usuario en auth.users con el ID específico
    console.log('Creating auth user with email:', email, 'and custom_id:', uniqueId);
    
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { custom_id: uniqueId }
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      
      // Manejar errores específicos de Supabase
      if (authError.message && authError.message.includes('already been registered')) {
        return res.status(409).json({
          error: 'Email Already Exists',
          message: 'Ya existe un usuario con este email'
        });
      }
      
      return res.status(400).json({
        error: 'Auth Error',
        message: 'Error al crear el usuario en autenticación: ' + (authError.message || 'Error desconocido')
      });
    }

    if (!authUser || !authUser.user) {
      console.error('No auth user returned:', authUser);
      return res.status(500).json({
        error: 'Auth Error',
        message: 'No se pudo crear el usuario en autenticación'
      });
    }

    console.log('Auth user created successfully:', authUser.user.id);

    // Verificación final del email antes de crear el perfil (evitar race conditions)
    try {
      const { data: finalCheck, error: finalCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (finalCheckError) {
        console.error('Error in final email check:', finalCheckError);
        // Si falla la verificación final, eliminar el usuario de auth y fallar
        try {
          await supabase.auth.admin.deleteUser(authUser.user.id);
          console.log('Auth user deleted after final check failure');
        } catch (deleteError) {
          console.error('Error deleting auth user after final check failure:', deleteError);
        }
        return res.status(500).json({
          error: 'Database Error',
          message: 'Error al verificar email antes de crear perfil'
        });
      }

      if (finalCheck) {
        console.error('Email became duplicate between verification and creation:', email);
        // Si el email ya existe, eliminar el usuario de auth y fallar
        try {
          await supabase.auth.admin.deleteUser(authUser.user.id);
          console.log('Auth user deleted after email became duplicate');
        } catch (deleteError) {
          console.error('Error deleting auth user after email became duplicate:', deleteError);
        }
        return res.status(409).json({
          error: 'Email Already Exists',
          message: 'El email ya existe en el sistema (verificación tardía)'
        });
      }
    } catch (finalCheckException) {
      console.error('Exception in final email check:', finalCheckException);
      // Si falla la verificación final, eliminar el usuario de auth y fallar
      try {
        await supabase.auth.admin.deleteUser(authUser.user.id);
        console.log('Auth user deleted after final check exception');
      } catch (deleteError) {
        console.error('Error deleting auth user after final check exception:', deleteError);
      }
      return res.status(500).json({
        error: 'Database Error',
        message: 'Error al verificar email antes de crear perfil'
      });
    }

    // Crear perfil en profiles con el ID específico
    const profileData = {
      id: uniqueId, // Usar el UUID generado por JavaScript
      name,
      email,
      nickname: nickname || null,
      is_admin,
      total_points: 0
    };

    console.log('Creating profile with data:', profileData);

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single();

    if (profileError) {
      console.error('Error creating profile:', profileError);
      console.error('Profile data that failed:', profileData);
      
      // Si falla la creación del perfil, eliminar el usuario de auth
      try {
        console.log('Deleting auth user after profile creation failure:', authUser.user.id);
        await supabase.auth.admin.deleteUser(authUser.user.id);
        console.log('Auth user deleted successfully');
      } catch (deleteError) {
        console.error('Error deleting auth user after profile creation failure:', deleteError);
      }
      
      // Manejar errores específicos de base de datos
      if (profileError.code === '23505') {
        if (profileError.message.includes('email')) {
          return res.status(409).json({
            error: 'Email Already Exists',
            message: 'Ya existe un usuario con este email en el sistema'
          });
        } else if (profileError.message.includes('id')) {
          return res.status(409).json({
            error: 'User Already Exists',
            message: 'El usuario ya existe en el sistema'
          });
        }
      }
      
      throw profileError;
    }

    console.log('Profile created successfully:', profile);

    res.status(201).json({
      message: 'Usuario creado exitosamente',
      user: profile
    });

  } catch (error) {
    console.error('Error creating user:', error);
    
    // Si es un error de validación o conocido, devolver el mensaje específico
    if (error.message && (error.message.includes('already been registered') || error.message.includes('duplicate key'))) {
      return res.status(409).json({
        error: 'User Already Exists',
        message: 'Ya existe un usuario con este email'
      });
    }
    
    next(error);
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Obtener usuario por ID
 *     tags: [Usuarios]
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
 *         description: Información del usuario
 *       404:
 *         description: Usuario no encontrado
 */
router.get('/:id', [
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
    
    // Solo admins pueden ver otros usuarios, usuarios normales solo su propio perfil
    if (!req.profile.is_admin && req.profile.id !== id) {
      return res.status(403).json({
        error: 'Access Forbidden',
        message: 'Solo puedes ver tu propio perfil'
      });
    }

    const supabase = getSupabaseClient();
    const { data: user, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !user) {
      return res.status(404).json({
        error: 'User Not Found',
        message: 'Usuario no encontrado'
      });
    }

    res.json({ user });

  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Actualizar usuario (solo admins o propio perfil)
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *               nickname:
 *                 type: string
 *               is_admin:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Usuario actualizado
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: Sin permisos
 *       404:
 *         description: Usuario no encontrado
 */
router.put('/:id', [
  param('id').isUUID().withMessage('ID debe ser un UUID válido'),
  body('name').optional().isLength({ min: 2 }).withMessage('El nombre debe tener al menos 2 caracteres'),
  body('nickname').optional().isLength({ min: 1 }).withMessage('El apodo debe tener al menos 1 carácter'),
  body('is_admin').optional().isBoolean().withMessage('is_admin debe ser un valor booleano')
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
    const updateData = req.body;

    // Solo admins pueden actualizar otros usuarios o cambiar is_admin
    if (!req.profile.is_admin) {
      if (req.profile.id !== id) {
        return res.status(403).json({
          error: 'Access Forbidden',
          message: 'Solo puedes actualizar tu propio perfil'
        });
      }
      // Usuarios normales no pueden cambiar is_admin
      delete updateData.is_admin;
    }

    const supabase = getSupabaseClient();
    const { data: user, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !user) {
      return res.status(404).json({
        error: 'User Not Found',
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      message: 'Usuario actualizado exitosamente',
      user
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Eliminar usuario (solo admins)
 *     tags: [Usuarios]
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
 *         description: Usuario eliminado
 *       403:
 *         description: Sin permisos de administrador
 *       404:
 *         description: Usuario no encontrado
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

    // No permitir eliminar el propio usuario
    if (req.profile.id === id) {
      return res.status(400).json({
        error: 'Cannot Delete Self',
        message: 'No puedes eliminar tu propio usuario'
      });
    }

    const supabase = getSupabaseClient(true); // Usar cliente admin

    // Eliminar perfil
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);

    if (profileError) {
      throw profileError;
    }

    // Eliminar usuario de auth
    const { error: authError } = await supabase.auth.admin.deleteUser(id);
    if (authError) {
      console.error('Error deleting auth user:', authError);
      // Continuar aunque falle la eliminación de auth
    }

    res.json({
      message: 'Usuario eliminado exitosamente'
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;

