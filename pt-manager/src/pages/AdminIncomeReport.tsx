import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider
} from '@mui/material';
import {
  ArrowBack,
  Euro,
  Person,
  ShoppingCart,
  AddBox,
  Assessment,
  ExpandMore
} from '@mui/icons-material';
import { reportsService } from '../services/apiService';
import { AdminIncomeReportData } from '../types';

const AdminIncomeReport: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [reports, setReports] = useState<AdminIncomeReportData[]>([]);
  const [tournamentInfo, setTournamentInfo] = useState<{
    tournament_id: string;
    tournament_name: string;
    summary: {
      total_entry_fees: number;
      total_rebuys: number;
      total_addons: number;
      grand_total: number;
    };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadIncomeReport = async () => {
      if (!tournamentId) return;

      // Verificar permisos de administrador
      if (!user?.is_admin) {
        setError('No tienes permisos para acceder a este reporte. Solo los administradores pueden ver esta información.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await reportsService.getAdminIncomeReport(tournamentId);
        setReports(response.admin_breakdown || []);
        setTournamentInfo({
          tournament_id: response.tournament_id,
          tournament_name: response.tournament_name,
          summary: response.summary
        });
      } catch (err) {
        console.error('Error cargando reporte de ingresos:', err);
        if (!user) {
          setError('Debes iniciar sesión para acceder a este reporte.');
        } else if (err instanceof Error && err.message.includes('Token inválido')) {
          setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
        } else if (err instanceof Error && err.message.includes('No autenticado')) {
          setError('Debes iniciar sesión para acceder a este reporte.');
        } else if (err instanceof Error && err.message.includes('Forbidden')) {
          setError('No tienes permisos para acceder a este reporte.');
        } else {
          setError('Error al cargar el reporte de ingresos');
        }
      } finally {
        setLoading(false);
      }
    };

    loadIncomeReport();
  }, [tournamentId, user]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Cargando reporte de ingresos...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)}>
          Volver
        </Button>
      </Box>
    );
  }

  // Usar los totales calculados por el backend
  const totalIncome = tournamentInfo?.summary.grand_total || 0;
  const totalRegistrations = tournamentInfo?.summary.total_entry_fees ? Math.round(tournamentInfo.summary.total_entry_fees / 10) : 0; // Estimación basada en entry_fee
  const totalRebuys = tournamentInfo?.summary.total_rebuys || 0;
  const totalAddons = tournamentInfo?.summary.total_addons || 0;

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate(-1)}
            variant="outlined"
          >
            Volver
          </Button>
          <Box>
            <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Assessment />
              Reporte de Ingresos por Administrador
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {tournamentInfo?.tournament_name || `Torneo ID: ${tournamentId}`}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Resumen General */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Euro />
            Resumen General del Torneo
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={3} mt={2}>
            <Box>
              <Typography variant="h4" color="primary.main" fontWeight="bold">
                {formatCurrency(totalIncome)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ingresos Totales
              </Typography>
            </Box>
            <Box>
              <Typography variant="h5" color="success.main" fontWeight="bold">
                {totalRegistrations}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Inscripciones
              </Typography>
            </Box>
            <Box>
              <Typography variant="h5" color="info.main" fontWeight="bold">
                {totalRebuys}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Recompras
              </Typography>
            </Box>
            <Box>
              <Typography variant="h5" color="secondary.main" fontWeight="bold">
                {totalAddons}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Addons
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Reporte por Administrador */}
      {reports.length === 0 ? (
        <Alert severity="info">
          No hay datos de ingresos para mostrar en este torneo.
        </Alert>
      ) : (
        <Box>
          <Typography variant="h6" gutterBottom>
            Detalle por Administrador
          </Typography>

          {reports.map((report, index) => (
            <Accordion key={report.admin_id} defaultExpanded={index === 0}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box display="flex" alignItems="center" gap={2} width="100%">
                  <Person />
                  <Box flexGrow={1}>
                    <Typography variant="h6">{report.admin_name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Entry Fees: {formatCurrency(report.entry_fees)} • Rebuys: {formatCurrency(report.rebuys)} • Addons: {formatCurrency(report.addons)}
                    </Typography>
                  </Box>
                  <Chip
                    label={formatCurrency(report.total)}
                    color="primary"
                    size="small"
                    variant="filled"
                  />
                </Box>
              </AccordionSummary>

              <AccordionDetails>
                {/* Resumen del Administrador */}
                <Box display="flex" flexWrap="wrap" gap={3} mb={3}>
                  <Box>
                    <Typography variant="h6" color="success.main">
                      {formatCurrency(report.entry_fees)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Entry Fees
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="h6" color="info.main">
                      {formatCurrency(report.rebuys)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Rebuys
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="h6" color="secondary.main">
                      {formatCurrency(report.addons)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Addons
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="h6" color="primary.main" fontWeight="bold">
                      {formatCurrency(report.total)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total
                    </Typography>
                  </Box>
                </Box>

                {/* Nota informativa */}
                <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                  <Typography variant="body2" color="info.contrastText">
                    Este reporte muestra las sumas totales cobradas por cada administrador en el torneo.
                    Para ver detalles individuales de cada transacción, consulta los logs del sistema.
                  </Typography>
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default AdminIncomeReport;
