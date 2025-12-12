/**
 * Health Monitoring Controller
 * Handles HTTP requests for field health time-series analysis
 */

class HealthMonitoringController {
  constructor(healthMonitoringService, fieldModel) {
    this.healthMonitoringService = healthMonitoringService;
    this.Field = fieldModel;
  }

  /**
   * GET /api/v1/fields/:field_id/health/history
   * Get field health history and analysis
   */
  async getFieldHealthHistory(req, res, next) {
    try {
      const { field_id: fieldId } = req.params;
      const { startDate, endDate, period } = req.query;
      const { user_id: userId } = req.user;

      // 1. Verify field ownership
      const field = await this.Field.findByPk(fieldId);
      if (!field) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'FIELDNOTFOUND',
            message: 'Field not found',
          },
        });
      }

      if (field.user_id !== userId) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have access to this field',
          },
        });
      }

      // 2. Calculate date range (if period specified, calculate dates)
      let start = startDate;
      let end = endDate;

      if (period) {
        [end] = new Date().toISOString().split('T'); // Today
        const periodDays = this.parsePeriod(period);
        if (!periodDays) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALIDPERIOD',
              message: 'Invalid period format. Use 7d, 30d, 60d, 90d, or 365d',
            },
          });
        }
        const currentDate = new Date();
        currentDate.setDate(currentDate.getDate() - periodDays);
        [start] = currentDate.toISOString().split('T');
      }

      // 3. Validate required parameters
      if (!start || !end) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSINGPARAMETERS',
            message: 'Either (startDate and endDate) or period parameter is required',
          },
        });
      }

      // 4. Call service to analyze health
      const analysis = await this.healthMonitoringService.analyzeFieldHealth(fieldId, start, end);

      // 5. Return response
      return res.status(200).json({
        success: true,
        data: analysis,
        meta: {
          timestamp: new Date().toISOString(),
          correlationId: req.headers['x-request-id'] || null,
        },
      });
    } catch (error) {
      // Handle known errors
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.message.toUpperCase().replace(/ /g, '_'),
            message: error.message,
          },
        });
      }

      // Pass unexpected errors to error handler middleware
      next(error);
    }
  }

  /**
   * Parse period string to days
   * @private
   */
  parsePeriod(period) {
    const match = period.match(/^(\d+)d$/);
    if (!match) return null;

    const days = parseInt(match[1], 10);
    const validPeriods = [7, 30, 60, 90, 365];

    if (!validPeriods.includes(days)) return null;

    return days;
  }
}

module.exports = HealthMonitoringController;
