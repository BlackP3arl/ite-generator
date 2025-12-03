/**
 * CSRF Protection Middleware
 * Validates origin header to prevent cross-site request forgery attacks
 */

export function validateCSRF(request) {
  // Get origin and host from request headers
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  const referer = request.headers.get('referer');

  // Allow same-origin requests (no origin header in same-origin requests)
  if (!origin && !referer) {
    return { valid: true };
  }

  // Validate origin matches host
  if (origin) {
    try {
      const originUrl = new URL(origin);
      if (originUrl.host !== host) {
        return {
          valid: false,
          error: 'Invalid origin - possible CSRF attack'
        };
      }
    } catch (error) {
      return {
        valid: false,
        error: 'Invalid origin header'
      };
    }
  }

  // Validate referer as fallback
  if (!origin && referer) {
    try {
      const refererUrl = new URL(referer);
      if (refererUrl.host !== host) {
        return {
          valid: false,
          error: 'Invalid referer - possible CSRF attack'
        };
      }
    } catch (error) {
      return {
        valid: false,
        error: 'Invalid referer header'
      };
    }
  }

  return { valid: true };
}
