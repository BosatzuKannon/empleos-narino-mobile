import * as Notifications from 'expo-notifications';

// =======================================================
// DEEP LINKING DE NOTIFICACIONES → RUTAS DE LA APP
// =======================================================

export type NotificationType =
  | 'application_status' // Escenario A: actualización de postulación → "Postulaciones"
  | 'offer_status'       // Escenario B: estado de oferta de la empresa → "Ofertas"
  | 'new_offer';         // Nueva oferta publicada → "Inicio" (lista de ofertas)

export interface NotificationData {
  type?: NotificationType;
  // Ruta explícita enviada por el backend (opcional, override del mapeo por type)
  route?: string;
  applicationId?: string;
  offerId?: string;
  offerTitle?: string;
  status?: string;
}

const TYPE_TO_ROUTE: Record<NotificationType, string> = {
  application_status: '/(tabs)/applications',
  offer_status: '/(tabs)/offers',
  new_offer: '/(tabs)',
};

export function getNotificationRoute(
  data: NotificationData | undefined,
): string | null {
  if (!data) return null;
  if (typeof data.route === 'string' && data.route.trim()) {
    return data.route;
  }
  if (data.type && TYPE_TO_ROUTE[data.type]) {
    return TYPE_TO_ROUTE[data.type];
  }
  return null;
}

export function extractRouteFromResponse(
  response: Notifications.NotificationResponse | null | undefined,
): string | null {
  if (!response) return null;
  const data = response.notification.request.content
    .data as NotificationData | undefined;
  return getNotificationRoute(data);
}
