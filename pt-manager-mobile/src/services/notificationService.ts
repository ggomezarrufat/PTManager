import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configurar el comportamiento de las notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export class NotificationService {
  static async requestPermissions() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Permisos de notificación denegados');
      return false;
    }
    
    return true;
  }

  static async scheduleTournamentNotification(
    tournamentName: string,
    startTime: Date,
    notificationId: string
  ) {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Torneo Programado',
        body: `${tournamentName} está a punto de comenzar`,
        data: { tournamentId: notificationId },
      },
      trigger: {
        date: startTime,
      },
    });
  }

  static async scheduleLevelChangeNotification(
    tournamentName: string,
    level: number,
    smallBlind: number,
    bigBlind: number
  ) {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Cambio de Nivel',
        body: `${tournamentName} - Nivel ${level}: ${smallBlind}/${bigBlind}`,
        sound: 'default',
      },
      trigger: null, // Notificación inmediata
    });
  }

  static async scheduleBreakNotification(
    tournamentName: string,
    breakDuration: number
  ) {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Break del Torneo',
        body: `${tournamentName} - Break de ${breakDuration} minutos`,
        sound: 'default',
      },
      trigger: null,
    });
  }

  static async scheduleTournamentEndNotification(
    tournamentName: string,
    winnerName: string
  ) {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Torneo Finalizado',
        body: `${tournamentName} - Ganador: ${winnerName}`,
        sound: 'default',
      },
      trigger: null,
    });
  }

  static async cancelNotification(notificationId: string) {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  static async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  static async getScheduledNotifications() {
    return await Notifications.getAllScheduledNotificationsAsync();
  }
}

export default NotificationService;

