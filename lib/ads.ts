// =======================================================
// ANUNCIOS (mini-CMS) — Capa de acceso a la API /ads
// =======================================================

import { File } from 'expo-file-system';
import { apiFetch } from './apiClient';
import { normalizeWhatsAppNumber } from './services';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || '';
const PRESIGNED_URL_API = `${API_BASE}/offers/generatePresignedUrl`;

export interface Advertisement {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  redirectUrl: string | null;
  whatsapp: string | null;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
}

export interface AdvertisementPayload {
  name: string;
  description: string;
  imageUrl: string;
  redirectUrl?: string | null;
  whatsapp?: string | null;
  expiresAt: string;
  isActive?: boolean;
}

/** Anuncios vigentes (público). */
export async function fetchActiveAds(): Promise<Advertisement[]> {
  const res = await fetch(`${API_BASE}/ads/active`);
  if (!res.ok) throw new Error(`Error al obtener anuncios: HTTP ${res.status}`);
  const json = await res.json();
  return (json?.advertisements || []) as Advertisement[];
}

/** Todos los anuncios (solo admin). */
export async function fetchAllAds(): Promise<Advertisement[]> {
  const json = await apiFetch(`${API_BASE}/ads`, { authenticated: true });
  return (json?.advertisements || []) as Advertisement[];
}

export async function createAdvertisement(
  payload: AdvertisementPayload,
): Promise<Advertisement> {
  const json = await apiFetch(`${API_BASE}/ads`, {
    method: 'POST',
    authenticated: true,
    body: JSON.stringify(payload),
  });
  return json.advertisement as Advertisement;
}

export async function updateAdvertisement(
  id: string,
  payload: Partial<AdvertisementPayload>,
): Promise<Advertisement> {
  const json = await apiFetch(`${API_BASE}/ads/${id}`, {
    method: 'PUT',
    authenticated: true,
    body: JSON.stringify(payload),
  });
  return json.advertisement as Advertisement;
}

export async function deleteAdvertisement(id: string): Promise<void> {
  await apiFetch(`${API_BASE}/ads/${id}`, {
    method: 'DELETE',
    authenticated: true,
  });
}

/** Sube la imagen al bucket de Supabase, carpeta `ads`, vía URL firmada. */
export async function uploadAdvertisementImage(
  uri: string,
  fileName: string,
  fileType: string,
): Promise<string> {
  const data = await apiFetch(PRESIGNED_URL_API, {
    method: 'POST',
    authenticated: true,
    body: JSON.stringify({ fileName, fileType, fileCategory: 'ads' }),
  });

  const { signedUrl, url } = data as { signedUrl?: string; url?: string };
  if (!signedUrl || !url) {
    throw new Error('No se recibió la URL firmada del servidor.');
  }

  const bytes = await new File(uri).arrayBuffer();
  const uploadResponse = await fetch(signedUrl, {
    method: 'PUT',
    body: bytes,
    headers: { 'Content-Type': fileType },
  });

  if (!uploadResponse.ok) {
    throw new Error(`Error subiendo la imagen: ${uploadResponse.status}`);
  }

  return url;
}

/** Destino al tocar el anuncio: WhatsApp primero, luego URL. */
export function buildAdLink(ad: Advertisement): string | null {
  const number = normalizeWhatsAppNumber(ad.whatsapp);
  if (number) return `https://wa.me/${number}`;
  if (ad.redirectUrl) return ad.redirectUrl;
  return null;
}
