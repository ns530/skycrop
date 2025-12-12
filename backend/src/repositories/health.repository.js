const Sequelize = require('sequelize');
const HealthRecord = require('../models/health.model');

/**
 * Repository for health record data access
 */
class HealthRepository {
  /**
   * Find health records by field ID and date range
   * @param {string} field_id - Field UUID
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Promise<Array<HealthRecord>>}
   */
  async findByFieldAndDateRange(field_id, startDate, endDate) {
    return await HealthRecord.findAll({
      where: {
        field_id,
        measurementdate: {
          [Sequelize.Op.between]: [startDate, endDate],
        },
      },
      order: [['measurementdate', 'ASC']],
    });
  }

  /**
   * Find latest health record for a field
   * @param {string} field_id - Field UUID
   * @returns {Promise<HealthRecord|null>}
   */
  async findLatestByField(field_id) {
    return await HealthRecord.findOne({
      where: { field_id },
      order: [['measurementdate', 'DESC']],
    });
  }

  /**
   * Create a new health record
   * @param {Object} data - Health record data
   * @returns {Promise<HealthRecord>}
   */
  async create(data) {
    return await HealthRecord.create(data);
  }

  /**
   * Bulk create health records
   * @param {Array<Object>} records - Array of health record data
   * @returns {Promise<Array<HealthRecord>>}
   */
  async bulkCreate(records) {
    return await HealthRecord.bulkCreate(records);
  }

  /**
   * Find health record by ID
   * @param {string} recordId - Health record UUID
   * @returns {Promise<HealthRecord|null>}
   */
  async findById(recordId) {
    return await HealthRecord.findByPk(recordId);
  }

  /**
   * Delete health records older than a specific date
   * @param {string} beforeDate - Date before which to delete records
   * @returns {Promise<number>} Number of deleted records
   */
  async deleteBeforeDate(beforeDate) {
    return await HealthRecord.destroy({
      where: {
        measurementdate: {
          [Sequelize.Op.lt]: beforeDate,
        },
      },
    });
  }
}

module.exports = HealthRepository;
