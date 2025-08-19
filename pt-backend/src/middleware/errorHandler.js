const errorHandler = (err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Error de validación de express-validator
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Los datos proporcionados no son válidos',
      details: err.details || err.message
    });
  }

  // Error de JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid Token',
      message: 'Token de autenticación inválido'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token Expired',
      message: 'Token de autenticación expirado'
    });
  }

  // Error de Supabase
  if (err.code) {
    let statusCode = 500;
    let message = 'Error interno del servidor';

    switch (err.code) {
      case '23505': // Unique violation
        statusCode = 409;
        message = 'El recurso ya existe';
        break;
      case '23503': // Foreign key violation
        statusCode = 400;
        message = 'Referencia a recurso inexistente';
        break;
      case '42P01': // Undefined table
        statusCode = 500;
        message = 'Error de configuración de base de datos';
        break;
      case 'PGRST116': // No rows returned
        statusCode = 404;
        message = 'Recurso no encontrado';
        break;
      case '42P17': // Infinite recursion in policy
        statusCode = 500;
        message = 'Error de configuración de permisos';
        break;
    }

    return res.status(statusCode).json({
      error: 'Database Error',
      message,
      code: err.code
    });
  }

  // Errores HTTP personalizados
  if (err.statusCode || err.status) {
    return res.status(err.statusCode || err.status).json({
      error: err.name || 'HTTP Error',
      message: err.message || 'Error en la solicitud'
    });
  }

  // Error genérico
  const statusCode = 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Error interno del servidor' 
    : err.message;

  res.status(statusCode).json({
    error: 'Internal Server Error',
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};

module.exports = errorHandler;

