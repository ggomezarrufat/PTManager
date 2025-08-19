const express = require('express');
const { body, validationResult } = require('express-validator');
const { getSupabaseClient } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email del usuario
 *               password:
 *                 type: string
 *                 description: Contraseña del usuario
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 session:
 *                   type: object
 *                   properties:
 *                     access_token:
 *                       type: string
 *                     refresh_token:
 *                       type: string
 *                     expires_in:
 *                       type: integer
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Credenciales incorrectas
 */
router.post('/login', [
  body('email').isEmail().withMessage('Email válido requerido'),
  body('password').isLength({ min: 6 }).withMessage('Contraseña debe tener al menos 6 caracteres')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Datos inválidos',
        details: errors.array()
      });
    }

    const { email, password } = req.body;
    const supabase = getSupabaseClient();

    // Intentar login con Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      let message = 'Error al iniciar sesión';
      
      switch (error.message) {
        case 'Invalid login credentials':
          message = 'Email o contraseña incorrectos';
          break;
        case 'Email not confirmed':
          message = 'Por favor confirma tu email antes de iniciar sesión';
          break;
        case 'Too many requests':
          message = 'Demasiados intentos. Intenta de nuevo en unos minutos';
          break;
      }

      return res.status(401).json({
        error: 'Authentication Failed',
        message
      });
    }

    // Obtener perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      return res.status(500).json({
        error: 'Profile Error',
        message: 'Error al obtener perfil de usuario'
      });
    }

    res.json({
      message: 'Login exitoso',
      user: profile,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in,
        expires_at: data.session.expires_at
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refrescar sesión y obtener nuevo access token
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refresh_token
 *             properties:
 *               refresh_token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token renovado
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Refresh token inválido o expirado
 */
router.post('/refresh', [
  body('refresh_token').isString().withMessage('refresh_token requerido')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Datos inválidos',
        details: errors.array()
      });
    }

    const { refresh_token } = req.body;
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.refreshSession({ refresh_token });

    if (error || !data?.session) {
      return res.status(401).json({
        error: 'Refresh Failed',
        message: 'Refresh token inválido o expirado'
      });
    }

    // Obtener perfil para devolver al cliente de forma consistente
    const userId = data.session.user.id;
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    res.json({
      message: 'Token refrescado',
      user: profile || null,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in,
        expires_at: data.session.expires_at
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrar nuevo usuario
 *     tags: [Autenticación]
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
 *               password:
 *                 type: string
 *                 minLength: 6
 *               name:
 *                 type: string
 *               nickname:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *       400:
 *         description: Datos inválidos
 *       409:
 *         description: Email ya existe
 */
router.post('/register', [
  body('email').isEmail().withMessage('Email válido requerido'),
  body('password').isLength({ min: 6 }).withMessage('Contraseña debe tener al menos 6 caracteres'),
  body('name').notEmpty().withMessage('Nombre es requerido'),
  body('nickname').optional()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Datos inválidos',
        details: errors.array()
      });
    }

    const { email, password, name, nickname } = req.body;
    const supabase = getSupabaseClient();

    // Verificar si el email ya existe
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(409).json({
        error: 'Email Exists',
        message: 'El email ya está registrado'
      });
    }

    // Registrar usuario en Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          nickname: nickname || null
        }
      }
    });

    if (error) {
      return res.status(400).json({
        error: 'Registration Failed',
        message: error.message
      });
    }

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: {
        id: data.user.id,
        email: data.user.email,
        name,
        nickname: nickname || null
      },
      needsConfirmation: !data.session // true si necesita confirmar email
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Obtener información del usuario actual
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Información del usuario
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: No autenticado
 */
router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    res.json({
      user: req.profile
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Cerrar sesión
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sesión cerrada exitosamente
 *       401:
 *         description: No autenticado
 */
router.post('/logout', authenticateToken, async (req, res, next) => {
  try {
    const supabase = getSupabaseClient();
    
    // Cerrar sesión en Supabase
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return res.status(500).json({
        error: 'Logout Failed',
        message: 'Error al cerrar sesión'
      });
    }

    res.json({
      message: 'Sesión cerrada exitosamente'
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;

