const DEFAULT_ADMIN_TOKEN = 'livinglab2026';

export const ADMIN_COOKIE_NAME = 'admin_token';

export function getAdminTokens() {
  const configuredToken = process.env.ADMIN_TOKEN?.trim();
  return Array.from(new Set([configuredToken, DEFAULT_ADMIN_TOKEN].filter((token): token is string => Boolean(token))));
}

export function getPrimaryAdminToken() {
  return getAdminTokens()[0] ?? DEFAULT_ADMIN_TOKEN;
}

export function isValidAdminToken(value: string) {
  return getAdminTokens().includes(value.trim());
}
