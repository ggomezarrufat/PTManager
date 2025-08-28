// Función para ejecutar sincronización manual del reloj
// Esta puede ser llamada desde un cron job o manualmente

export default async function handler(req, res) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    console.log('🔄 Ejecutando sincronización manual de relojes...');

    // Llamar a la función de sincronización principal
    const syncResponse = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/clock/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    });

    const syncData = await syncResponse.json();

    if (syncData.success) {
      console.log('✅ Sincronización manual completada exitosamente');
      res.status(200).json({
        success: true,
        message: 'Sincronización manual completada',
        data: syncData
      });
    } else {
      console.error('❌ Error en sincronización manual:', syncData.error);
      res.status(500).json({
        success: false,
        error: syncData.error || 'Error en sincronización'
      });
    }

  } catch (error) {
    console.error('Error en sync-manual:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
}
