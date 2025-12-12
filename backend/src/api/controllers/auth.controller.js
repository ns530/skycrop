const { getAuthService } = require('../../services/auth.service');

const authService = getAuthService();

/**
 * Auth Controller
 * Routes should bind these handlers.
 */
module.exports = {
  // POST /api/v1/auth/signup
  async signup(req, res, next) {
    try {
      console.log('AuthController.signup called with body:', req.body);
      const { email, password, name } = req.body || {};
      console.log('Extracted params:', { email, name, passwordLength: password?.length });
      const result = await authService.signup(email, password, name);
      console.log('Signup result:', result);
      return res.status(201).json({
        success: true,
        data: result,
      });
    } catch (err) {
      console.error('Signup error:', err);
      return next(err);
    }
  },

  // POST /api/v1/auth/login
  async login(req, res, next) {
    try {
      const { email, password } = req.body || {};
      const result = await authService.login(email, password);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      return next(err);
    }
  },

  // POST /api/v1/auth/logout
  async logout(req, res, next) {
    try {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

      if (token) {
        await authService.logout(token);
      }
      return res.status(200).json({ success: true });
    } catch (err) {
      return next(err);
    }
  },

  // GET /api/v1/auth/verify-email?token=...
  async verifyEmail(req, res, next) {
    try {
      const { token } = req.query || {};
      const result = await authService.verifyEmail(token);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      return next(err);
    }
  },

  // POST /api/v1/auth/request-password-reset
  async requestPasswordReset(req, res, next) {
    try {
      const { email } = req.body || {};
      const result = await authService.requestPasswordReset(email);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      return next(err);
    }
  },

  // POST /api/v1/auth/reset-password
  async resetPassword(req, res, next) {
    try {
      const { token, newPassword } = req.body || {};
      const result = await authService.resetPassword(token, newPassword);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      return next(err);
    }
  },
};
