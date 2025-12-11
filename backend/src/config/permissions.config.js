'use strict';

/**
 * Role-Based Access Control (RBAC) Permissions
 * Defines what actions each role can perform
 */

const PERMISSIONS = {
  // Admin: Full access to everything
  admin: ['*'],

  // Manager: Manage fields, recommendations, analytics
  manager: [
    'fields.create',
    'fields.read',
    'fields.readall', // Can read all fields in organization
    'fields.update',
    'fields.delete',
    'health.read',
    'health.compute',
    'recommendations.read',
    'recommendations.generate',
    'recommendations.update',
    'recommendations.delete',
    'yield.read',
    'yield.predict',
    'yield.create',
    'yield.update',
    'analytics.read',
    'dashboard.read',
    'notifications.read',
    'notifications.send',
    'users.read', // Can view team members
  ],

  // Farmer: Own fields only, basic analytics
  farmer: [
    'fields.create',
    'fields.readown', // Can only read own fields
    'fields.updateown',
    'fields.deleteown',
    'health.readown',
    'health.computeown',
    'recommendations.readown',
    'recommendations.generateown',
    'recommendations.updateown',
    'yield.readown',
    'yield.predictown',
    'yield.createown',
    'analytics.readown',
    'dashboard.readown',
    'notifications.readown',
  ],

  // Viewer: Read-only access
  viewer: [
    'fields.read',
    'health.read',
    'recommendations.read',
    'yield.read',
    'analytics.read',
    'dashboard.read',
    'notifications.read',
  ],
};

/**
 * Check if a role has a specific permission
 * @param {string} role - User role (admin, manager, farmer, viewer)
 * @param {string} permission - Permission string (e.g., 'fields.create')
 * @returns {boolean} - True if role has permission
 */
function hasPermission(role, permission) {
  if (!role || !permission) return false;

  const rolePermissions = PERMISSIONS[role];
  if (!rolePermissions) return false;

  // Admin has all permissions
  if (rolePermissions.includes('*')) return true;

  // Check exact permission match
  if (rolePermissions.includes(permission)) return true;

  // Check wildcard permission (e.g., 'fields.*' matches 'fields.create')
  const permissionParts = permission.split('.');
  const wildcardPermission = `${permissionParts[0]}.*`;
  if (rolePermissions.includes(wildcardPermission)) return true;

  return false;
}

/**
 * Check if a role can access a resource
 * For "own" permissions, need to check ownership
 * @param {string} role - User role
 * @param {string} resource - Resource type (fields, health, etc.)
 * @param {string} action - Action (read, create, update, delete)
 * @param {boolean} isOwner - Whether user owns the resource
 * @returns {boolean} - True if role can access resource
 */
function canAccessResource(role, resource, action, isOwner = false) {
  // Admin has all permissions
  if (role === 'admin') return true;

  // Build permission string
  const fullPermission = `${resource}.${action}`;
  const ownPermission = `${resource}.${action}own`;
  const allPermission = `${resource}.${action}all`;

  // Check full permission (e.g., 'fields.read')
  if (hasPermission(role, fullPermission)) return true;

  // Check "all" permission (e.g., 'fields.readall')
  if (hasPermission(role, allPermission)) return true;

  // Check "own" permission if user is owner (e.g., 'fields.readown')
  if (isOwner && hasPermission(role, ownPermission)) return true;

  return false;
}

/**
 * Get all permissions for a role
 * @param {string} role - User role
 * @returns {string[]} - Array of permissions
 */
function getRolePermissions(role) {
  return PERMISSIONS[role] || [];
}

/**
 * Get role hierarchy (for display purposes)
 * @returns {Object} - Role information
 */
function getRoleHierarchy() {
  return {
    admin: {
      name: 'Administrator',
      level: 4,
      description: 'Full access to all features and user management',
      permissions: PERMISSIONS.admin,
    },
    manager: {
      name: 'Manager',
      level: 3,
      description: 'Manage fields, view all analytics, manage team',
      permissions: PERMISSIONS.manager,
    },
    farmer: {
      name: 'Farmer',
      level: 2,
      description: 'Manage own fields, basic analytics',
      permissions: PERMISSIONS.farmer,
    },
    viewer: {
      name: 'Viewer',
      level: 1,
      description: 'Read-only access to shared fields and data',
      permissions: PERMISSIONS.viewer,
    },
  };
}

/**
 * Check if a user can manage another user (based on role hierarchy)
 * @param {string} actorRole - Role of user performing action
 * @param {string} targetRole - Role of user being acted upon
 * @returns {boolean} - True if actor can manage target
 */
function canManageUser(actorRole, targetRole) {
  const hierarchy = getRoleHierarchy();
  const actorLevel = hierarchy[actorRole]?.level || 0;
  const targetLevel = hierarchy[targetRole]?.level || 0;

  // Admin can manage anyone
  if (actorRole === 'admin') return true;

  // Manager can manage farmer and viewer
  if (actorRole === 'manager' && (targetRole === 'farmer' || targetRole === 'viewer')) {
    return true;
  }

  // Can't manage users with equal or higher level
  return actorLevel > targetLevel;
}

module.exports = {
  PERMISSIONS,
  hasPermission,
  canAccessResource,
  getRolePermissions,
  getRoleHierarchy,
  canManageUser,
};
