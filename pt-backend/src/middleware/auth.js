const jwt = require('jsonwebtoken');
const { getSupabaseClient } = require('../config/supabase');

/**
 * Middleware para verificar token JWT
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    console.log('🔐 Auth middleware - Request:', {
      method: req.method,
      url: req.url,
      hasAuthHeader: !!authHeader,
      hasToken: !!token
    });

    if (!token) {
      console.log('❌ Auth middleware - No token provided');
      return res.status(401).json({
        error: 'Access Denied',
        message: 'Token de acceso requerido'
      });
    }

    // Verificar token con Supabase
    const supabase = getSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser(token);

    console.log('🔐 Auth middleware - Token verification:', {
      hasUser: !!user,
      userId: user?.id,
      error: error?.message
    });

    if (error || !user) {
      console.log('❌ Auth middleware - Token verification failed');
      return res.status(401).json({
        error: 'Invalid Token',
        message: 'Token inválido o expirado'
      });
    }

    // Obtener perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return res.status(401).json({
        error: 'Profile Not Found',
        message: 'Perfil de usuario no encontrado'
      });
    }

    // Agregar usuario y perfil al request
    req.user = user;
    req.profile = profile;

    console.log('✅ Auth middleware - User authenticated:', {
      userId: user.id,
      email: user.email,
      isAdmin: profile.is_admin
    });

    next();
  } catch (error) {
    console.error('Error in auth middleware:', error);
    res.status(401).json({
      error: 'Authentication Error',
      message: 'Error de autenticación'
    });
  }
};

/**
 * Middleware para verificar permisos de administrador
 */
const requireAdmin = (req, res, next) => {
  if (!req.profile || !req.profile.is_admin) {
    return res.status(403).json({
      error: 'Access Forbidden',
      message: 'Se requieren permisos de administrador'
    });
  }
  next();
};

/**
 * Middleware opcional de autenticación (no falla si no hay token)
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next(); // Continuar sin usuario
    }

    const supabase = getSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (!error && user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        req.user = user;
        req.profile = profile;
      }
    }

    next();
  } catch (error) {
    // En auth opcional, los errores no detienen la ejecución
    next();
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  optionalAuth
};

