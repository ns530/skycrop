const { getFieldHealthService } = require('../../services/fieldHealth.service');

const fieldHealthService = getFieldHealthService();

/**
 * FieldHealthController.show()
 * GET /api/v1/fields/:id/health
 */
module.exports = {
  async show(req, res, next) {
    try {
      const { user_id: userId } = req.user;
      const { id } = req.params;
      const data = await fieldHealthService.getFieldHealth(id, userId);
      return res.status(200).json({ success: true, data });
    } catch (err) {
      return next(err);
    }
  },
};
