'use strict';

const HealthRecord = require('../models/health.model');
const Sequelize = require('sequelize');

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
    return await HealthRecord.findAll({
      where: {
        field_id: fieldId,
        measurement_date: {
          [Sequelize.Op.between]: [startDate, endDate],
        },
      },
      order: [['measurement_date', 'ASC']],
    });
  }

  /**
   * Find latest health record for a field
   * @param {string} fieldId - Field UUID
   * @returns {Promise<HealthRecord|null>}
   */
  async findLatestByField(fieldId) {
    return await HealthRecord.findOne({
      where: { field_id: fieldId },
      order: [['measurement_date', 'DESC']],
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
        measurement_date: {
          [Sequelize.Op.lt]: beforeDate,
        },
      },
    });
  }
}

module.exports = HealthRepository;

