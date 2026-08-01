import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import apiFetch from './apiClient';

// Muestra las notificaciones como banners incluso con la app en primer plano.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function configureNotifications(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Notificaciones',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#558B2F',
    });
  }
}

export async function registerPushToken(): Promise<boolean> {
  try {
    if (!Device.isDevice) {
      return false;
    }

    type Permission = { granted: boolean; status?: string };

    const current = (await Notifications.getPermissionsAsync()) as unknown as Permission;
    let permission = current.status ?? (current.granted ? 'granted' : 'denied');
    if (permission !== 'granted' && permission !== 'provisional') {
      const requested = (await Notifications.requestPermissionsAsync()) as unknown as Permission;
      permission = requested.status ?? (requested.granted ? 'granted' : 'denied');
    }

    // En iOS "provisional" ya permite obtener un token: se normaliza a "granted".
    const normalized = permission === 'provisional' ? 'granted' : permission;

    const body: Record<string, string> = {
      platform: Platform.OS,
      permission_status: normalized,
    };

    if (normalized === 'granted') {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      const token = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : {},
      );
      body.token = token.data;
    }

    // Permiso no concedido: le pedimos al backend limpiar tokens previos.
    await apiFetch('/settings/push-token', {
      method: 'POST',
      authenticated: true,
      body: JSON.stringify(body),
    });

    return true;
  } catch (error) {
    console.warn('Error al registrar el push token:', error);
    return false;
  }
}
