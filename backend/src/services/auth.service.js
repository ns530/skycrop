'use strict';

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/user.model');
const { initRedis, getRedisClient } = require('../config/redis.config');
const { ValidationError, UnauthorizedError, ConflictError } = require('../errors/custom-errors');

const JWTEXPIRES = '30d';
const EMAILVERIFYTTL = 60 * 60 * 24; // 24 hours
const RESETTTL = 60 * 60 * 24; // 24 hours
const LOCKOUTTTL = 60 * 30; // 30 minutes
const FAILEDATTEMPTSLIMIT = 5;

function isValidEmail(email) {
  // RFC5322-lite
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPassword(password) {
  // Min 8 chars, 1 uppercase, 1 lowercase, 1 number
  if (typeof password !== 'string') return false;
  const lengthOk = password.length >= 8;
  const upperOk = /[A-Z]/.test(password);
  const lowerOk = /[a-z]/.test(password);
  const numberOk = /[0-9]/.test(password);
  return lengthOk && upperOk && lowerOk && numberOk;
}

function generateJWT(user) {
  const payload = {
    user_id: user.user_id,
    email: user.email,
    role: user.role || 'farmer',
  };
  return jwt.sign(payload, process.env.JWTSECRET, { expiresIn: JWTEXPIRES });
}

function secondsUntil(expUnix) {
  const now = Math.floor(Date.now() / 1000);
  return Math.max(0, expUnix - now);
}

class AuthService {
  constructor() {
    this.redis = null;
  }

  async init() {
    if (!this.redis) {
      this.redis = await initRedis();
    }
    return this;
  }

  // Email/password signup
  async signup(email, password, name) {
    await this.init();

    if (!isValidEmail(email)) {
      throw new ValidationError('Invalid email format', { field: 'email' });
    }
    if (!isValidPassword(password)) {
      throw new ValidationError(
        'Password must be at least 8 chars with uppercase, lowercase, and a number',
        { field: 'password' }
      );
    }
    if (!name || name.trim().length === 0) {
      throw new ValidationError('Name is required', { field: 'name' });
    }

    const existing = await User.findByEmail(email);
    if (existing) {
      throw new ConflictError('Email already registered', { email });
    }

    const passwordhash = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      passwordhash,
      name,
      role: 'farmer',
      authprovider: 'email',
      emailverified: false,
      status: 'active',
    });

    // Email verification token
    const verificationToken = crypto.randomUUID();
    if (this.redis) {
      await this.redis.setEx(`email-verify:${verificationToken}`, EMAILVERIFYTTL, user.user_id);
    }

    // Issue session token per SRS
    const token = generateJWT(user);

    return {
      user: {
        user_id: user.user_id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailverified: user.emailverified,
      },
      token,
      verification: {
        token: verificationToken, // For dev/testing. In prod, send via email
        expiresinseconds: EMAILVERIFYTTL,
      },
    };
  }

  // Email/password login
  async login(email, password) {
    await this.init();

    const user = await User.scope('withSensitive').findByEmail(email);
    if (!user) {
      // Avoid user enumeration
      throw new UnauthorizedError('Invalid credentials');
    }

    const lockKey = `account-lock:${user.user_id}`;
    const isLocked = this.redis ? await this.redis.get(lockKey) : null;
    if (isLocked) {
      throw new UnauthorizedError('Account locked. Try again in 30 minutes.');
    }

    const valid = user.passwordhash && (await bcrypt.compare(password, user.passwordhash));
    if (!valid) {
      await this.handleFailedLogin(user.user_id);
      throw new UnauthorizedError('Invalid credentials');
    }

    // Success: clear failed attempts
    if (this.redis) {
      await this.redis.del(`failed-attempts:${user.user_id}`);
    }

    // Update last login
    await user.update({ lastlogin: new Date() });

    const token = generateJWT(user);

    return {
      user: {
        user_id: user.user_id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailverified: user.emailverified,
      },
      token,
    };
  }

  // Logout by blacklisting JWT
  async logout(token) {
    await this.init();

    try {
      const decoded = jwt.decode(token);
      if (!decoded || !decoded.exp) {
        return { success: true }; // nothing to do
      }
      const ttl = secondsUntil(decoded.exp);
      if (ttl > 0 && this.redis) {
        await this.redis.setEx(`blacklist:${token}`, ttl, '1');
      }
      return { success: true };
    } catch (e) {
      // best-effort
      return { success: true };
    }
  }

  // Email verification
  async verifyEmail(token) {
    await this.init();
    const key = `email-verify:${token}`;
    const user_id = this.redis ? await this.redis.get(key) : null;
    if (!user_id) {
      throw new ValidationError('Verification link is invalid or expired');
    }

    await User.update({ emailverified: true }, { where: { user_id: user_id } });
    if (this.redis) {
      await this.redis.del(key);
    }
    return { success: true };
  }

  // Request password reset
  async requestPasswordReset(email) {
    await this.init();
    const user = await User.findByEmail(email);
    if (!user) {
      // Do not disclose user existence
      return { success: true };
    }
    const token = crypto.randomUUID();
    if (this.redis) {
      await this.redis.setEx(`password-reset:${token}`, RESETTTL, user.user_id);
    }
    return {
      success: true,
      reset: {
        token, // In prod: email this to user
        expiresinseconds: RESETTTL,
      },
    };
  }

  // Reset password using token
  async resetPassword(token, newPassword) {
    await this.init();
    if (!isValidPassword(newPassword)) {
      throw new ValidationError(
        'Password must be at least 8 chars with uppercase, lowercase, and a number',
        { field: 'password' }
      );
    }
    const user_id = this.redis ? await this.redis.get(`password-reset:${token}`) : null;
    if (!user_id) {
      throw new ValidationError('Reset link is invalid or expired');
    }

    const passwordhash = await bcrypt.hash(newPassword, 10);
    await User.update({ passwordhash }, { where: { user_id: user_id } });

    // Invalidate token and existing sessions (blacklist strategy is per-JWT; user should log back in)
    if (this.redis) {
      await this.redis.del(`password-reset:${token}`);
    }
    return { success: true };
  }

  async handleFailedLogin(user_id) {
    if (!this.redis) return;
    const attemptsKey = `failed-attempts:${user_id}`;
    const attempts = await this.redis.incr(attemptsKey);
    // Ensure window
    await this.redis.expire(attemptsKey, LOCKOUTTTL);

    if (attempts >= FAILEDATTEMPTSLIMIT) {
      await this.redis.setEx(`account-lock:${user_id}`, LOCKOUTTTL, 'locked');
    }
  }
}

let authServiceSingleton;

/**
 * Provide singleton instance (ensures single Redis client).
 */
function getAuthService() {
  if (!authServiceSingleton) {
    authServiceSingleton = new AuthService();
  }
  return authServiceSingleton;
}

module.exports = {
  AuthService,
  getAuthService,
};
