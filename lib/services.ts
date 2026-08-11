// =======================================================
// SERVICIOS (Talent Marketplace) — Capa de acceso a la API
// Todos los endpoints apuntan al módulo /services del backend.
// =======================================================

import { apiFetch } from './apiClient';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || '';

// -----------------------------------------------------------------------------
// TIPOS (espejo del esquema Prisma Service / ServiceCategory)
// -----------------------------------------------------------------------------

export type ServicePriceType = 'HOURLY' | 'FIXED' | 'TO_BE_AGREED';
export type ServiceStatus = 'ACTIVE' | 'PAUSED';
export type ServicePaymentStatus = 'PENDING' | 'APPROVED' | 'DECLINED';
export type ServicePlanType = 'STANDARD' | 'FEATURED';

export interface ServiceUser {
  id: string;
  firstName: string;
  lastName?: string | null;
  phone?: string | null;
  city?: string | null;
}

export interface ServiceCategory {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
  _count?: { services: number };
}

export interface Service {
  id: string;
  title: string;
  description: string;
  municipality: string;
  price: number | string | null;
  priceType: ServicePriceType;
  imageUrl: string | null;
  status: ServiceStatus;
  paymentStatus: ServicePaymentStatus;
  isFeatured: boolean;
  expiresAt: string | null;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
  categoryId: string;
  category?: ServiceCategory;
  user?: ServiceUser;
}

export interface CreateServicePayload {
  categoryId: string;
  title: string;
  description: string;
  municipality: string;
  price?: number | null;
  priceType?: ServicePriceType;
  imageUrl?: string | null;
}

export interface GenerateCheckoutResponse {
  reference: string;
  amountInCents: number;
  currency: string;
  signature: string;
  checkoutUrl: string;
}

// -----------------------------------------------------------------------------
// CONSTANTES DE PRESENTACIÓN
// -----------------------------------------------------------------------------

export const PRICE_TYPE_LABELS: Record<ServicePriceType, string> = {
  HOURLY: 'Por hora',
  FIXED: 'Precio fijo',
  TO_BE_AGREED: 'A convenir',
};

export const PRICE_TYPE_ICONS: Record<ServicePriceType, string> = {
  HOURLY: 'time-outline',
  FIXED: 'cash-outline',
  TO_BE_AGREED: 'hand-left-outline',
};

// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------

export const getServiceProviderName = (service: Service): string => {
  const user = service.user;
  if (!user) return '';
  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  return fullName || 'Profesional independiente';
};

export const formatServicePrice = (service: Service): string => {
  if (service.priceType === 'TO_BE_AGREED') {
    return 'A convenir';
  }

  if (service.price == null) {
    return PRICE_TYPE_LABELS[service.priceType];
  }

  const num = Number(service.price);
  const amount = Number.isNaN(num)
    ? `${service.price}`
    : `$${num.toLocaleString('es-CO')}`;

  return service.priceType === 'HOURLY' ? `${amount} / hora` : amount;
};

// Normaliza un teléfono para WhatsApp (prefijo 57 si parece número local CO)
export const normalizeWhatsAppNumber = (phone: string | null | undefined): string => {
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) return '';

  if (digits.startsWith('57') && digits.length >= 11) return digits;
  if (digits.length === 10) return `57${digits}`;
  return digits;
};

export const buildWhatsAppUrl = (
  phone: string | null | undefined,
  serviceTitle: string,
): string => {
  const number = normalizeWhatsAppNumber(phone);
  const message = `Hola, vi tu servicio de ${serviceTitle} en Empleos Nariño y me gustaría más información.`;
  const base = number ? `https://wa.me/${number}` : 'https://wa.me/';
  return `${base}?text=${encodeURIComponent(message)}`;
};

// -----------------------------------------------------------------------------
// ENDPOINTS
// -----------------------------------------------------------------------------

const SERVICES_ACTIVE_URL = `${API_BASE}/services/getActiveServices`;
const SERVICES_CATEGORIES_URL = `${API_BASE}/services/categories/getAll`;
const SERVICES_BY_USER_URL = `${API_BASE}/services/getServicesByUser`;
const SERVICES_CREATE_URL = `${API_BASE}/services/createService`;
const SERVICES_UPDATE_STATUS_URL = `${API_BASE}/services/updateServiceStatus`;
const SERVICES_DELETE_URL = `${API_BASE}/services/deleteService`;

/** Lista de servicios activos (público). */
export async function fetchActiveServices(): Promise<Service[]> {
  const res = await fetch(SERVICES_ACTIVE_URL);
  if (!res.ok) throw new Error(`Error al obtener servicios: HTTP ${res.status}`);

  const json = await res.json();
  const list = Array.isArray(json) ? json : (json?.services || json?.data || []);
  return list as Service[];
}

/** Lista de categorías de servicios (público). */
export async function fetchServiceCategories(): Promise<ServiceCategory[]> {
  const res = await fetch(SERVICES_CATEGORIES_URL);
  if (!res.ok) throw new Error(`Error al obtener categorías: HTTP ${res.status}`);

  const json = await res.json();
  const list = Array.isArray(json) ? json : (json?.data || []);
  return list as ServiceCategory[];
}

/** Incrementa el contador de vistas del servicio. */
export async function incrementServiceViews(serviceId: string): Promise<void> {
  try {
    await fetch(`${API_BASE}/services/${serviceId}/view`, { method: 'PATCH' });
  } catch (error) {
    console.error('Error al incrementar vistas del servicio:', error);
  }
}

/** Servicios publicados por el usuario autenticado. */
export async function fetchServicesByUser(): Promise<Service[]> {
  const json = await apiFetch(SERVICES_BY_USER_URL, { authenticated: true });
  const list = Array.isArray(json) ? json : (json?.data || []);
  return list as Service[];
}

/** Crea un nuevo servicio. */
export async function createService(
  payload: CreateServicePayload,
): Promise<Service> {
  const json = await apiFetch(SERVICES_CREATE_URL, {
    method: 'POST',
    authenticated: true,
    body: JSON.stringify(payload),
  });
  return (json?.service || json) as Service;
}

/** Genera el checkout de Wompi (pago pendiente) para un servicio publicado. */
export async function generateServiceCheckout(
  serviceId: string,
  planType: ServicePlanType,
  redirectUrl?: string,
): Promise<GenerateCheckoutResponse> {
  const json = await apiFetch(`${API_BASE}/wompi/generate-checkout`, {
    method: 'POST',
    authenticated: true,
    body: JSON.stringify({ serviceId, planType, redirectUrl }),
  });
  return json as GenerateCheckoutResponse;
}

/** Cambia el estado (ACTIVE | PAUSED) de un servicio propio. */
export async function updateServiceStatus(
  serviceId: string,
  status: ServiceStatus,
): Promise<void> {
  await apiFetch(`${SERVICES_UPDATE_STATUS_URL}/${serviceId}`, {
    method: 'PATCH',
    authenticated: true,
    body: JSON.stringify({ status }),
  });
}

/** Elimina un servicio propio. */
export async function deleteService(serviceId: string): Promise<void> {
  await apiFetch(`${SERVICES_DELETE_URL}/${serviceId}`, {
    method: 'DELETE',
    authenticated: true,
  });
}

export default {
  fetchActiveServices,
  fetchServiceCategories,
  incrementServiceViews,
  fetchServicesByUser,
  createService,
  updateServiceStatus,
  deleteService,
  formatServicePrice,
  getServiceProviderName,
  buildWhatsAppUrl,
  PRICE_TYPE_LABELS,
};
