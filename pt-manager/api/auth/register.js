const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { email, password, name, nickname } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        error: 'Email, contraseña y nombre son requeridos'
      });
    }

    // Validación básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Email inválido'
      });
    }

    // Validación básica de contraseña
    if (password.length < 6) {
      return res.status(400).json({
        error: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    console.log(`📝 Intentando registro para: ${email}`);

    // Crear usuario con Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          nickname: nickname || name
        }
      }
    });

    if (error) {
      let message = 'Error al crear cuenta';
      let statusCode = 400;
      
      switch (error.message) {
        case 'User already registered':
          message = 'Este email ya está registrado';
          break;
        case 'Password should be at least 6 characters':
          message = 'La contraseña debe tener al menos 6 caracteres';
          break;
        case 'Invalid email':
          message = 'Email inválido';
          break;
        default:
          console.error('Error de registro:', error.message);
      }

      return res.status(statusCode).json({
        error: 'Registration Failed',
        message
      });
    }

    if (!data.user) {
      return res.status(500).json({
        error: 'Registration Failed',
        message: 'Error al crear usuario'
      });
    }

    // Crear perfil en la tabla profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        email: data.user.email,
        name,
        nickname: nickname || name,
        is_admin: false,
        created_at: new Date().toISOString()
      });

    if (profileError) {
      console.error('Error creando perfil:', profileError);
      // No fallar el registro si el perfil no se puede crear
    }

    const response = {
      message: 'Usuario creado exitosamente. Por favor confirma tu email.',
      user: {
        id: data.user.id,
        email: data.user.email,
        name,
        nickname: nickname || name,
        is_admin: false
      },
      session: data.session ? {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in,
        expires_at: data.session.expires_at
      } : null
    };

    console.log(`✅ Registro exitoso para: ${email}`);

    res.status(201).json(response);

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
}
