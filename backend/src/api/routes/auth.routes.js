'use strict';

const express = require('express');
const jwt = require('jsonwebtoken');
const AuthController = require('../controllers/auth.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { validateRequest, schemas } = require('../middleware/validation.middleware');
const { authLimiter } = require('../middleware/rateLimit.middleware');
const Joi = require('joi');
// Load configured passport instance
const passport = require('../../config/passport.config');

const router = express.Router();

// Verify email query schema
const verifyEmailQuery = Joi.object({
  token: Joi.string().required(),
});

// POST /api/v1/auth/signup
// Strict rate limiting for auth endpoints
router.post('/signup', authLimiter, validateRequest(schemas.signup), AuthController.signup);

// POST /api/v1/auth/login
router.post('/login', authLimiter, validateRequest(schemas.login), AuthController.login);

// POST /api/v1/auth/logout
router.post('/logout', authMiddleware, AuthController.logout);

// GET /api/v1/auth/verify-email?token=...
router.get('/verify-email', validateRequest(verifyEmailQuery, 'query'), AuthController.verifyEmail);

// POST /api/v1/auth/request-password-reset
router.post('/request-password-reset', authLimiter, validateRequest(schemas.requestPasswordReset), AuthController.requestPasswordReset);

// POST /api/v1/auth/reset-password
router.post('/reset-password', authLimiter, validateRequest(schemas.resetPassword), AuthController.resetPassword);

// === Google OAuth ===

// GET /api/v1/auth/google
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['openid', 'profile', 'email'],
    session: false,
  })
);

// GET /api/v1/auth/google/callback
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: '/login?error=oauth_failed',
  }),
  (req, res) => {
    // Issue JWT and redirect to frontend with token
    const token = jwt.sign(
      {
        user_id: req.user.user_id,
        email: req.user.email,
        role: req.user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    const frontend = process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${frontend}/auth/callback?token=${encodeURIComponent(token)}`);
  }
);

module.exports = router;