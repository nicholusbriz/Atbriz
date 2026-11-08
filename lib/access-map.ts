/**
 * CENTRAL ACCESS MAP — the single file that defines who can do what.
 *
 * Three layers, all data-driven:
 *  1. GATED_SECTIONS  → which pages/sections exist (frontend menu + hash guard)
 *  2. PERMISSIONS     → which actions exist inside sections (backend checks)
 *  3. ROUTE_PERMISSIONS → which API route needs which permission
 *
 * Roles store allowed pages/permissions in Mongo (managed via the Pages UI).
 * 'dev' implicitly has everything. To add a feature: add a section/permission
 * here, map its routes below, and it appears in the Pages manager automatically.
 */

// ─── 1. Gated sections (frontend pages) ───────────────────────────────────────
export const GATED_SECTIONS = [
  { id: 'admin-reports', label: 'Reports', hash: 'admin-reports' },
  { id: 'sync', label: 'Locations Sync', hash: 'sync' },
  { id: 'roles', label: 'Roles', hash: 'roles' },
  { id: 'users', label: 'Users', hash: 'users' },
  { id: 'logs', label: 'Logs', hash: 'logs' },
  { id: 'dashboard', label: 'Dashboard', hash: 'dashboard' },
] as const;

export type GatedSectionId = (typeof GATED_SECTIONS)[number]['id'];
export const GATED_SECTION_IDS = GATED_SECTIONS.map((s) => s.id) as string[];

/**
 * Which gated sections each role may open — hardcoded, NOT stored in DB.
 * Grouped by role. 'dev' is implicit everywhere; listed for clarity.
 */
export const SECTION_ACCESS: Record<string, string[]> = {
  admin: ['admin-reports', 'dashboard'],
  dev: ['admin-reports', 'sync', 'roles', 'users', 'logs', 'dashboard'],
  user: ['dashboard'],
};

// ─── 2. Permissions (actions inside sections) ─────────────────────────────────
export const PERMISSIONS = [
  { id: 'reports.view', label: 'Can view reports', section: 'admin-reports' },
  { id: 'reports.manage', label: 'Can edit & delete reports', section: 'admin-reports' },
  { id: 'sync.manage', label: 'Can add, edit & delete locations', section: 'sync' },
  { id: 'pages.manage', label: 'Can manage access settings', section: 'roles' },
  { id: 'users.manage', label: 'Can manage users', section: 'users' },
  { id: 'logs.view', label: 'Can view activity logs', section: 'logs' },
] as const;

export type PermissionId = (typeof PERMISSIONS)[number]['id'];
export const PERMISSION_IDS = PERMISSIONS.map((p) => p.id) as string[];

export function permissionsForSection(sectionId: string) {
  return PERMISSIONS.filter((p) => p.section === sectionId);
}

// ─── 3. API route → required permission ───────────────────────────────────────
// Key format: "METHOD /api/path". Unmapped admin routes are denied by default.
export const ROUTE_PERMISSIONS: Record<string, string> = {
  'GET /api/admin/reports': 'reports.view',
  'DELETE /api/admin/reports': 'reports.manage',
  'PATCH /api/admin/reports/status': 'reports.manage',
  'POST /api/admin/sync/locations': 'sync.manage',
  'PATCH /api/admin/sync/locations': 'sync.manage',
  'DELETE /api/admin/sync/locations': 'sync.manage',
  'GET /api/admin/users': 'users.manage',
  'PATCH /api/admin/users': 'users.manage',
  'GET /api/admin/roles': 'pages.manage',
  'PUT /api/admin/pages': 'pages.manage',
  'POST /api/admin/auth/invalidate-all': 'pages.manage',
  'POST /api/admin/users/invalidate': 'users.manage',
  'GET /api/admin/logs': 'logs.view',
  'DELETE /api/admin/logs': 'logs.view',
};
