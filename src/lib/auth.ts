const DEFAULT_ADMIN_TOKEN = 'livinglab2026';

export const ADMIN_COOKIE_NAME = 'admin_token';

export function getAdminToken() {
  return process.env.ADMIN_TOKEN?.trim() || DEFAULT_ADMIN_TOKEN;
}
