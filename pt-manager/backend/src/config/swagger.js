const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Poker Tournament Manager API',
      version: '1.0.0',
      description: `API completa para gestión de torneos de poker con funcionalidades de:
      
• **Autenticación**: Login, registro y gestión de sesiones
• **Usuarios**: Gestión de perfiles y permisos de administrador
• **Torneos**: Creación, gestión de estado y configuración completa
• **Jugadores**: Registro, eliminación y gestión de fichas
• **Recompras y Addons**: Sistema completo de compra de fichas
• **Reloj de Torneo**: Control de niveles y tiempo en tiempo real
• **Sistema de Puntos**: Configuración personalizable de puntuación

**Estado del servidor**: Funcionando en puerto 3001
**Documentación**: Disponible en /api-docs
**Health Check**: /health`,
      contact: {
        name: 'API Support',
        email: 'support@pokertournament.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3001',
        description: 'Servidor de desarrollo (puerto 3001)'
      },
      {
        url: 'http://192.168.0.101:3001',
        description: 'Servidor local desde red WiFi'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtenido del endpoint de login'
        }
      },
      schemas: {
        User: {
          type: 'object',
          required: ['id', 'email', 'name'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID único del usuario'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email del usuario'
            },
            name: {
              type: 'string',
              description: 'Nombre completo del usuario'
            },
            nickname: {
              type: 'string',
              nullable: true,
              description: 'Sobrenombre del usuario'
            },
            is_admin: {
              type: 'boolean',
              description: 'Indica si el usuario tiene permisos de administrador'
            },
            total_points: {
              type: 'integer',
              description: 'Total de puntos acumulados'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de última actualización'
            }
          }
        },
        Tournament: {
          type: 'object',
          required: ['id', 'name', 'entry_fee', 'initial_chips', 'rebuy_chips', 'addon_chips', 'blind_structure', 'point_system', 'scheduled_start_time'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID único del torneo'
            },
            name: {
              type: 'string',
              description: 'Nombre del torneo'
            },
            description: {
              type: 'string',
              nullable: true,
              description: 'Descripción del torneo'
            },
            status: {
              type: 'string',
              enum: ['scheduled', 'active', 'paused', 'finished'],
              default: 'scheduled',
              description: 'Estado actual del torneo'
            },
            max_players: {
              type: 'integer',
              default: 100,
              description: 'Número máximo de jugadores'
            },
            entry_fee: {
              type: 'number',
              minimum: 0,
              description: 'Costo de entrada'
            },
            initial_chips: {
              type: 'integer',
              minimum: 1,
              description: 'Fichas iniciales por jugador'
            },
            rebuy_chips: {
              type: 'integer',
              minimum: 1,
              description: 'Fichas por recompra'
            },
            addon_chips: {
              type: 'integer',
              minimum: 1,
              description: 'Fichas por addon'
            },
            max_rebuys: {
              type: 'integer',
              default: 3,
              description: 'Máximo número de recompras permitidas'
            },
            max_addons: {
              type: 'integer',
              default: 1,
              description: 'Máximo número de addons permitidos'
            },
            blind_structure: {
              type: 'object',
              description: 'Estructura de blinds del torneo (JSONB)'
            },
            point_system: {
              type: 'object',
              description: 'Sistema de puntos del torneo (JSONB)'
            },
            scheduled_start_time: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha y hora programada de inicio'
            },
            actual_start_time: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Fecha y hora real de inicio'
            },
            end_time: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Fecha y hora de finalización'
            },
            created_by: {
              type: 'string',
              format: 'uuid',
              description: 'ID del usuario creador'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de última actualización'
            },
            season_id: {
              type: 'integer',
              nullable: true,
              description: 'ID de la temporada asociada'
            }
          }
        },
        TournamentPlayer: {
          type: 'object',
          required: ['id', 'tournament_id', 'user_id', 'current_chips', 'entry_fee_paid'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID único del jugador en el torneo'
            },
            tournament_id: {
              type: 'string',
              format: 'uuid',
              description: 'ID del torneo'
            },
            user_id: {
              type: 'string',
              format: 'uuid',
              description: 'ID del usuario'
            },
            current_chips: {
              type: 'integer',
              minimum: 0,
              description: 'Fichas actuales del jugador'
            },
            entry_fee_paid: {
              type: 'number',
              minimum: 0,
              description: 'Entry fee pagado por el jugador'
            },
            registration_time: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha y hora de registro'
            },
            final_position: {
              type: 'integer',
              nullable: true,
              description: 'Posición final en el torneo'
            },
            points_earned: {
              type: 'integer',
              minimum: 0,
              description: 'Puntos ganados en el torneo'
            },
            is_active: {
              type: 'boolean',
              description: 'Indica si el jugador está activo'
            },
            is_eliminated: {
              type: 'boolean',
              description: 'Indica si el jugador ha sido eliminado'
            },
            eliminated_at: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Fecha y hora de eliminación'
            }
          }
        },
        Rebuy: {
          type: 'object',
          required: ['id', 'player_id', 'tournament_id', 'amount', 'chips_received'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID único de la recompra'
            },
            player_id: {
              type: 'string',
              format: 'uuid',
              description: 'ID del jugador'
            },
            tournament_id: {
              type: 'string',
              format: 'uuid',
              description: 'ID del torneo'
            },
            amount: {
              type: 'number',
              minimum: 0,
              description: 'Cantidad pagada por la recompra'
            },
            chips_received: {
              type: 'integer',
              minimum: 1,
              description: 'Fichas recibidas por la recompra'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha y hora de la recompra'
            }
          }
        },
        Addon: {
          type: 'object',
          required: ['id', 'player_id', 'tournament_id', 'amount', 'chips_received'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID único del addon'
            },
            player_id: {
              type: 'string',
              format: 'uuid',
              description: 'ID del jugador'
            },
            tournament_id: {
              type: 'string',
              format: 'uuid',
              description: 'ID del torneo'
            },
            amount: {
              type: 'number',
              minimum: 0,
              description: 'Cantidad pagada por el addon'
            },
            chips_received: {
              type: 'integer',
              minimum: 1,
              description: 'Fichas recibidas por el addon'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha y hora del addon'
            }
          }
        },
        TournamentClock: {
          type: 'object',
          required: ['tournament_id', 'current_level', 'time_remaining_seconds'],
          properties: {
            tournament_id: {
              type: 'string',
              format: 'uuid',
              description: 'ID del torneo'
            },
            current_level: {
              type: 'integer',
              minimum: 1,
              description: 'Nivel actual de blinds'
            },
            time_remaining_seconds: {
              type: 'integer',
              minimum: 0,
              description: 'Tiempo restante en segundos'
            },
            is_paused: {
              type: 'boolean',
              description: 'Indica si el reloj está pausado'
            },
            paused_at: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Fecha y hora de pausa'
            },
            total_pause_time_seconds: {
              type: 'integer',
              minimum: 0,
              description: 'Tiempo total de pausa en segundos'
            },
            last_updated: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha y hora de última actualización'
            }
          }
        },
        BlindLevel: {
          type: 'object',
          required: ['level', 'small_blind', 'big_blind', 'duration_minutes'],
          properties: {
            level: {
              type: 'integer',
              minimum: 1,
              description: 'Nivel del blind'
            },
            small_blind: {
              type: 'integer',
              minimum: 1,
              description: 'Valor del small blind'
            },
            big_blind: {
              type: 'integer',
              minimum: 2,
              description: 'Valor del big blind'
            },
            duration_minutes: {
              type: 'integer',
              minimum: 1,
              description: 'Duración del nivel en minutos'
            },
            antes: {
              type: 'integer',
              nullable: true,
              description: 'Valor del antes (opcional)'
            }
          }
        },
        PointSystem: {
          type: 'object',
          required: ['positions', 'default_points'],
          properties: {
            positions: {
              type: 'object',
              description: 'Puntos por posición (ej: {"1": 100, "2": 80})'
            },
            default_points: {
              type: 'integer',
              minimum: 0,
              description: 'Puntos por defecto para posiciones no especificadas'
            }
          }
        },
        Error: {
          type: 'object',
          required: ['error', 'message'],
          properties: {
            error: {
              type: 'string',
              description: 'Tipo de error'
            },
            message: {
              type: 'string',
              description: 'Mensaje descriptivo del error'
            },
            details: {
              type: 'object',
              description: 'Detalles adicionales del error'
            }
          }
        },
        Season: {
          type: 'object',
          required: ['id', 'name', 'start_date', 'end_date'],
          properties: {
            id: {
              type: 'integer',
              description: 'ID único de la temporada'
            },
            name: {
              type: 'string',
              description: 'Nombre de la temporada'
            },
            start_date: {
              type: 'string',
              format: 'date',
              description: 'Fecha de inicio de la temporada'
            },
            end_date: {
              type: 'string',
              format: 'date',
              description: 'Fecha de fin de la temporada'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de última actualización'
            },
            created_by: {
              type: 'string',
              format: 'uuid',
              description: 'ID del usuario creador'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Autenticación',
        description: 'Endpoints para login, registro y gestión de sesiones'
      },
      {
        name: 'Usuarios',
        description: 'Gestión de usuarios y perfiles (requiere permisos de admin)'
      },
      {
        name: 'Torneos',
        description: 'CRUD completo de torneos y gestión de estados'
      },
      {
        name: 'Jugadores',
        description: 'Gestión de jugadores en torneos'
      },
      {
        name: 'Recompras',
        description: 'Sistema de recompras para jugadores'
      },
      {
        name: 'Addons',
        description: 'Sistema de addons para jugadores'
      },
      {
        name: 'Reloj',
        description: 'Control del reloj y niveles del torneo'
      },
      {
        name: 'Reports',
        description: 'Reportes y estadísticas del sistema'
      },
      {
        name: 'Seasons',
        description: 'Gestión de temporadas (requiere permisos de admin)'
      },
      {
        name: 'Sistema',
        description: 'Endpoints del sistema (health check, etc.)'
      }
    ],
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.js'], // paths to files containing OpenAPI definitions
};

const specs = swaggerJsdoc(options);

module.exports = (app) => {
  // Swagger page
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #2c3e50; }
      .swagger-ui .info .description { font-size: 14px; line-height: 1.6; }
      .swagger-ui .scheme-container { background: #f8f9fa; padding: 10px; border-radius: 4px; }
    `,
    customSiteTitle: "Poker Tournament API - Documentación Completa",
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
      docExpansion: 'list',
      tryItOutEnabled: true
    }
  }));

  // Swagger JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
};

