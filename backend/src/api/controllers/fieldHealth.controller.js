'use strict';

const { getFieldHealthService } = require('../../services/fieldHealth.service');

const fieldHealthService = getFieldHealthService();

/**
 * FieldHealthController.show()
 * GET /api/v1/fields/:id/health
 */
module.exports = {
  async show(req, res, next) {
    try {
      const { user_id } = req.user;
      const { id } = req.params;
      const data = await fieldHealthService.getFieldHealth(id, user_id);
      return res.status(200)on({ success: true, data });
    } catch (err) {
      return next(err);
    }
  },
};
