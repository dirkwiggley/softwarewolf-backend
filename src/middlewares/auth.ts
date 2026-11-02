import type { Request, Response, NextFunction } from 'express';
import type { Role } from '../generated/client/index.js';
import { verifyToken } from '../utils/jwt.js';

// Define the comprehensive session structure including the guest fallback parameter
export interface UserSessionContext {
  id: string | null;
  username: string | null;
  displayName: string;
  email: string | null;
  role: Role | 'GUEST';
}

// Extend Express Request types to safely attach the session profile context
declare global {
  namespace Express {
    interface Request {
      user?: UserSessionContext;
    }
  }
}

/**
 * Global authentication parser middleware.
 * Inspects incoming HttpOnly cookies for a valid session token.
 * If missing, altered, or expired, it automatically assigns a safe GUEST context.
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.auth_token;

  // Fallback Rule 1: No token provided -> Assign read-only guest identity
  if (!token) {
    req.user = {
      id: null,
      username: null,
      displayName: 'Anonymous Guest',
      email: null,
      role: 'GUEST'
    };
    return next();
  }

  const decoded = verifyToken(token);

  // Fallback Rule 2: Token verification failed -> Assign read-only guest identity
  if (!decoded) {
    req.user = {
      id: null,
      username: null,
      displayName: 'Anonymous Guest',
      email: null,
      role: 'GUEST'
    };
    return next();
  }

  // Success: Token is valid. Bind the authenticated profile parameters to the request context.
  req.user = {
    id: decoded.userId,
    username: decoded.username || null,
    displayName: decoded.displayName || 'Authenticated User',
    email: decoded.email || null,
    role: decoded.role
  };

  next();
};

/**
 * Strict route guarding middleware factories.
 * Now expanded to gracefully validate standard Prisma Roles and anonymous Guests.
 */
export const restrictTo = (...allowedRoles: (Role | 'GUEST')[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const currentUser = req.user;

    // 1. If no user context was attached by requireAuth, block access immediately
    if (!currentUser) {
      res.status(401).json({ error: 'Authentication layer error: Security context missing' });
      return;
    }

    // 2. If the user's role is not explicitly authorized in the argument list, block them
    if (!allowedRoles.includes(currentUser.role)) {
      res.status(403).json({ error: 'Access denied: Insufficient permission clearance level' });
      return;
    }

    // 3. User passed the gate! Proceed to the controller logic
    next();
  };
};
