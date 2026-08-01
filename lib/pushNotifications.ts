import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Alert, Platform } from 'react-native';
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
      console.error('Push Debug: abortado, Device.isDevice es false (emulador/simulador)');
      return false;
    }

    type Permission = { granted: boolean; status?: string };

    const current = (await Notifications.getPermissionsAsync()) as unknown as Permission;
    let permission = current.status ?? (current.granted ? 'granted' : 'denied');
    console.error(`Push Debug: permiso actual = ${permission}`);

    if (permission !== 'granted' && permission !== 'provisional') {
      console.error('Push Debug: solicitando permiso de notificaciones...');
      const requested = (await Notifications.requestPermissionsAsync()) as unknown as Permission;
      permission = requested.status ?? (requested.granted ? 'granted' : 'denied');
      console.error(`Push Debug: permiso tras la solicitud = ${permission}`);
    }

    // En iOS "provisional" ya permite obtener un token: se normaliza a "granted".
    const normalized = permission === 'provisional' ? 'granted' : permission;
    console.error(`Push Debug: permission_status normalizado = ${normalized}`);

    const body: Record<string, string> = {
      platform: Platform.OS,
      permission_status: normalized,
    };

    if (normalized === 'granted') {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      console.error(`Push Debug: projectId = ${projectId ?? 'NO ENCONTRADO'}`);

      const token = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : {},
      );
      console.error(`Push Debug: token obtenido = ${token.data}`);
      body.token = token.data;
    }

    console.error(`Push Debug: enviando POST /settings/push-token con body = ${JSON.stringify(body)}`);
    const response = await apiFetch<{ statusCode?: number; message?: string }>(
      '/settings/push-token',
      {
        method: 'POST',
        authenticated: true,
        body: JSON.stringify(body),
      },
    );
    console.error(`Push Debug: respuesta del servidor = ${JSON.stringify(response)}`);

    return true;
  } catch (error) {
    console.error('Push Debug: error en registerPushToken =', error);
    Alert.alert('Push Debug', String(error));
    return false;
  }
}
