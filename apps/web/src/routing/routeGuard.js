import { Role } from '@metro-fix/core-types';
/**
 * Declarative ACL: path → allowed roles.
 *
 * Design decisions:
 * - Admin-only routes are gated to `Role.ADMIN`.
 * - Dispatch routes are accessible to both `CUSTOMER_CARE` and `ADMIN`
 *   (admins should never be locked out of operational views).
 * - Routes not in this map are open to any authenticated user.
 */
const routeAcl = {
    // ── Administration (ADMIN only) ──
    '/workers': [Role.ADMIN],
    '/customers': [Role.ADMIN],
    '/service-catalog': [Role.ADMIN],
    '/subscriptions': [Role.ADMIN],
    '/financials': [Role.ADMIN],
    '/admin': [Role.ADMIN],
    // ── Customer Care Operations ──
    '/dispatch': [Role.ADMIN, Role.CUSTOMER_CARE],
    '/active-roster': [Role.ADMIN, Role.CUSTOMER_CARE],
};
/**
 * Evaluate whether a user may access a given path.
 *
 * Priority:
 *  1. No user → unauthenticated (redirect to /login)
 *  2. Route not in ACL → allowed for any authenticated user
 *  3. Route in ACL but user role not in allowed list → forbidden
 *  4. Otherwise → allowed
 */
export function evaluateRouteGuard(path, user) {
    if (!user) {
        return { status: 'unauthenticated' };
    }
    const allowedRoles = routeAcl[path];
    // Route has no ACL entry → open to any authenticated user
    if (!allowedRoles) {
        return { status: 'allowed' };
    }
    if (allowedRoles.includes(user.role)) {
        return { status: 'allowed' };
    }
    return { status: 'forbidden', requiredRoles: allowedRoles };
}
/**
 * Return the default home path for a given role.
 * Used by 403/404 "Return to Dashboard" buttons.
 */
export function getHomePathForRole(role) {
    switch (role) {
        case Role.ADMIN:
            return '/customers';
        case Role.CUSTOMER_CARE:
            return '/dispatch';
        default:
            return '/dispatch';
    }
}
/**
 * Check whether a given path is a known route in the platform.
 * Unknown paths should render the 404 view.
 */
const knownPaths = new Set([
    '/dispatch',
    '/active-roster',
    '/workers',
    '/customers',
    '/service-catalog',
    '/subscriptions',
    '/financials',
    '/admin',
    '/login',
    '/',
]);
export function isKnownRoute(path) {
    return knownPaths.has(path);
}
