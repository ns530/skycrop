const Sequelize = require('sequelize');
const HealthRecord = require('../models/health.model');

/**
 * Repository for health record data access
 */
class HealthRepository {
  /**
   * Find health records by field ID and date range
   * @param {string} fieldId - Field UUID
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Promise<Array<HealthRecord>>}
   */
  async findByFieldAndDateRange(fieldId, startDate, endDate) {
    return HealthRecord.findAll({
      where: {
        fieldId,
        measurementdate: {
          [Sequelize.Op.between]: [startDate, endDate],
        },
      },
      order: [['measurementdate', 'ASC']],
    });
  }

  /**
   * Find latest health record for a field
   * @param {string} fieldId - Field UUID
   * @returns {Promise<HealthRecord|null>}
   */
  async findLatestByField(fieldId) {
    return HealthRecord.findOne({
      where: { fieldId },
      order: [['measurementdate', 'DESC']],
    });
  }

  /**
   * Create a new health record
   * @param {Object} data - Health record data
   * @returns {Promise<HealthRecord>}
   */
  async create(data) {
    return HealthRecord.create(data);
  }

  /**
   * Bulk create health records
   * @param {Array<Object>} records - Array of health record data
   * @returns {Promise<Array<HealthRecord>>}
   */
  async bulkCreate(records) {
    return HealthRecord.bulkCreate(records);
  }

  /**
   * Find health record by ID
   * @param {string} recordId - Health record UUID
   * @returns {Promise<HealthRecord|null>}
   */
  async findById(recordId) {
    return HealthRecord.findByPk(recordId);
  }

  /**
   * Delete health records older than a specific date
   * @param {string} beforeDate - Date before which to delete records
   * @returns {Promise<number>} Number of deleted records
   */
  async deleteBeforeDate(beforeDate) {
    return HealthRecord.destroy({
      where: {
        measurementdate: {
          [Sequelize.Op.lt]: beforeDate,
        },
      },
    });
  }
}

module.exports = HealthRepository;
