import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Button, Alert, Chip } from '@mui/material';
import { io, Socket } from 'socket.io-client';

interface ConnectionDebugProps {
  tournamentId: string;
}

const ConnectionDebug: React.FC<ConnectionDebugProps> = ({ tournamentId }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('Desconectado');
  const [logs, setLogs] = useState<string[]>([]);
  const [clockState, setClockState] = useState<any>(null);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const connect = () => {
    if (socket) {
      socket.disconnect();
    }

    addLog('🔌 Intentando conectar a http://localhost:3001...');

    const newSocket = io('http://localhost:3001', {
      transports: ['websocket', 'polling'],
      timeout: 5000,
      forceNew: true
    });

    newSocket.on('connect', () => {
      addLog('✅ ¡CONEXIÓN EXITOSA!');
      addLog(`   Socket ID: ${newSocket.id}`);
      setIsConnected(true);
      setConnectionStatus('Conectado');

      // Unirse al torneo
      addLog(`🎯 Uniéndose al torneo ${tournamentId}...`);
      newSocket.emit('join-tournament', {
        tournamentId,
        userId: 'debug-user-' + Date.now()
      });
    });

    newSocket.on('disconnect', (reason) => {
      addLog(`🔌 Desconectado: ${reason}`);
      setIsConnected(false);
      setConnectionStatus('Desconectado');
    });

    newSocket.on('connect_error', (error) => {
      addLog(`❌ Error de conexión: ${error.message}`);
      setConnectionStatus('Error de conexión');
    });

    newSocket.on('clock-sync', (state) => {
      addLog('🎯 ¡SINCRONIZACIÓN RECIBIDA!');
      addLog(`   Nivel: ${state.current_level}`);
      addLog(`   Tiempo: ${state.time_remaining_seconds}s`);
      addLog(`   Estado: ${state.is_paused ? 'PAUSADO' : 'ACTIVO'}`);
      setClockState(state);
    });

    newSocket.on('clock-update', (state) => {
      addLog(`⏰ Actualización: ${state.time_remaining_seconds}s`);
      setClockState(state);
    });

    newSocket.on('level-changed', (data) => {
      addLog(`🎯 ¡CAMBIO DE NIVEL! ${data.new_level}`);
      setClockState(data.clock_state);
    });

    setSocket(newSocket);
  };

  const disconnect = () => {
    if (socket) {
      addLog('🔌 Desconectando...');
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
      setConnectionStatus('Desconectado');
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket]);

  return (
    <Card sx={{ maxWidth: 600, mx: 'auto', mt: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          🔍 WebSocket Connection Debug
        </Typography>

        <Box display="flex" gap={2} mb={2}>
          <Button
            variant="contained"
            color="primary"
            onClick={connect}
            disabled={isConnected}
          >
            🔌 Connect
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={disconnect}
            disabled={!isConnected}
          >
            🔌 Disconnect
          </Button>
          <Button
            variant="text"
            onClick={clearLogs}
          >
            🧹 Clear Logs
          </Button>
        </Box>

        <Box mb={2}>
          <Chip
            label={`Estado: ${connectionStatus}`}
            color={isConnected ? 'success' : connectionStatus === 'Error de conexión' ? 'error' : 'default'}
            variant={isConnected ? 'filled' : 'outlined'}
          />
        </Box>

        {clockState && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Estado del Reloj:</strong><br />
              Nivel: {clockState.current_level} | Tiempo: {clockState.time_remaining_seconds}s | Estado: {clockState.is_paused ? 'PAUSADO' : 'ACTIVO'}
            </Typography>
          </Alert>
        )}

        <Box
          sx={{
            maxHeight: 300,
            overflowY: 'auto',
            backgroundColor: '#f5f5f5',
            p: 2,
            borderRadius: 1,
            fontFamily: 'monospace',
            fontSize: '0.8rem'
          }}
        >
          {logs.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No hay logs aún. Haz clic en "Connect" para probar la conexión.
            </Typography>
          ) : (
            logs.map((log, index) => (
              <div key={index} style={{ marginBottom: '4px' }}>
                {log}
              </div>
            ))
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ConnectionDebug;
