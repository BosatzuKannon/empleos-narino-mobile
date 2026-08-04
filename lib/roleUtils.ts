// =======================================================
// Role utilities — single source of truth for role detection.
// Handles every shape the user/role can arrive in:
//   - 'custom:user_type' (Cognito-style custom attribute)
//   - 'user_type' / 'role'
//   - 'cognito:groups[0]'
//   - nested 'user_metadata.role' / 'app_metadata.role' (Supabase JWT)
//   - lowercase aliases ('applicant', 'enterprise') and Spanish ('candidato')
// Normalizes to UPPERCASE before comparing.
// =======================================================

export const ROLE_CANDIDATE = 'CANDIDATE';
export const ROLE_COMPANY_ADMIN = 'COMPANY_ADMIN';
export const ROLE_SUPER_ADMIN = 'SUPER_ADMIN';

// Synonyms that map to the "company" side of the marketplace.
const ENTERPRISE_ROLES = new Set([
  ROLE_COMPANY_ADMIN,
  ROLE_SUPER_ADMIN,
  'ENTERPRISE',
  'COMPANY',
  'EMPLOYER',
  'COMPANY_OWNER',
]);

// Synonyms that map to the "candidate" side of the marketplace.
const APPLICANT_ROLES = new Set([
  ROLE_CANDIDATE,
  'APPLICANT',
  'CANDIDATO',
  'CANDIDATE_USER',
]);

const normalizeRole = (value: unknown): string =>
  typeof value === 'string' ? value.trim().toUpperCase() : '';

function readNested(
  source: Record<string, unknown>,
  path: string,
): unknown {
  let current: unknown = source;
  for (const key of path.split('.')) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

/**
 * Extracts the raw (normalized, UPPERCASE) role from any user shape.
 * Returns '' when no role can be determined.
 */
export function getUserRole(
  user: Record<string, unknown> | null | undefined,
): string {
  if (!user) return '';

  const groups = user['cognito:groups'];
  const sources = [
    user['custom:user_type'],
    user.user_type,
    user.role,
    Array.isArray(groups) ? groups[0] : undefined,
    readNested(user, 'user_metadata.role'),
    readNested(user, 'user_metadata.user_type'),
    readNested(user, 'app_metadata.role'),
    readNested(user, 'app_metadata.user_type'),
  ];

  for (const source of sources) {
    const normalized = normalizeRole(source);
    if (normalized) return normalized;
  }

  return '';
}

/**
 * True when the user belongs to the company side.
 * Never true for guests or when the role is unknown.
 */
export function isEnterpriseUser(
  user: Record<string, unknown> | null | undefined,
): boolean {
  if (!user) return false;
  return ENTERPRISE_ROLES.has(getUserRole(user));
}

/**
 * True when the user belongs to the candidate side.
 * Safe fallback: a logged-in user with no explicit role is treated as a
 * candidate (mirrors the backend default `role = 'CANDIDATE'`), which
 * guarantees the candidate UI/tabs always render for real users.
 */
export function isCandidateUser(
  user: Record<string, unknown> | null | undefined,
): boolean {
  if (!user) return false;
  const role = getUserRole(user);
  if (!role) return true; // logged in without a role -> default candidate
  return APPLICANT_ROLES.has(role);
}
