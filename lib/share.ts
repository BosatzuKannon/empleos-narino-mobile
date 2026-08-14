import { Share } from 'react-native';

const SHARE_BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL || 'https://empleos-narino-backend.onrender.com'
).replace(/\/+$/, '');

export type ShareEntityType = 'offer' | 'service';

export const buildShareUrl = (type: ShareEntityType, id: string): string =>
  `${SHARE_BASE_URL}/share/${type}/${id}`;

export const shareItem = async (
  type: ShareEntityType,
  id: string,
  title: string,
): Promise<void> => {
  const message = `Mira "${title}" en Empleos Nariño: ${buildShareUrl(type, id)}`;
  try {
    await Share.share({ message, title: 'Empleos Nariño' });
  } catch (error) {
    console.error('Error al compartir:', error);
  }
};
