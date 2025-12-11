#!/usr/bin/env node

/**
 * SkyCrop Data Integrity Check Script
 * Verifies database consistency and integrity
 * Checks foreign keys, data types, required fields, and referential integrity
 */

const { sequelize } = require('../src/config/database.config');

class DataIntegrityChecker {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      status: 'unknown',
      checks: {},
      violations: [],
      summary: {},
    };
  }

  async run() {
    console.log('🔍 Running SkyCrop Data Integrity Check...');

    try {
      // Run all integrity checks
      await this.checkForeignKeyConstraints();
      await this.checkRequiredFields();
      await this.checkDataTypes();
      await this.checkReferentialIntegrity();
      await this.checkUniqueConstraints();
      await this.checkEnumValues();

      // Calculate overall status
      this.calculateOverallStatus();

      // Output results
      console.log(JSON.stringify(this.results, null, 2));
    } catch (error) {
      this.results.status = 'error';
      this.results.error = error.message;
      console.error('Data integrity check failed:', error.message);
      console.log(JSON.stringify(this.results, null, 2));
      process.exit(1);
    }
  }

  async checkForeignKeyConstraints() {
    console.log('Checking foreign key constraints...');

    const checks = [];
    const violations = [];

    // Check users table foreign keys (if any)
    try {
      const [userResults] = await sequelize.query(`
                SELECT COUNT(*) as orphanedrecords
                FROM users u
                LEFT JOIN userroles ur ON u.roleid = ur.id
                WHERE u.roleid IS NOT NULL AND ur.id IS NULL
            `);

      if (userResults[0].orphanedrecords > 0) {
        violations.push({
          table: 'users',
          constraint: 'roleid foreign key',
          type: 'foreignkeyviolation',
          count: userResults[0].orphanedrecords,
          description: 'Users with invalid roleid references',
        });
      }
    } catch (error) {
      checks.push({
        check: 'usersforeignkeys',
        status: 'error',
        error: error.message,
      });
    }

    // Check fields table foreign keys
    try {
      const [fieldResults] = await sequelize.query(`
                SELECT COUNT(*) as orphanedrecords
                FROM fields f
                LEFT JOIN users u ON f.userid = u.id
                WHERE f.userid IS NOT NULL AND u.id IS NULL
            `);

      if (fieldResults[0].orphanedrecords > 0) {
        violations.push({
          table: 'fields',
          constraint: 'userid foreign key',
          type: 'foreignkeyviolation',
          count: fieldResults[0].orphanedrecords,
          description: 'Fields with invalid userid references',
        });
      }
    } catch (error) {
      checks.push({
        check: 'fieldsforeignkeys',
        status: 'error',
        error: error.message,
      });
    }

    // Check recommendations table foreign keys
    try {
      const [recResults] = await sequelize.query(`
                SELECT COUNT(*) as orphanedrecords
                FROM recommendations r
                LEFT JOIN fields f ON r.fieldid = f.id
                WHERE r.fieldid IS NOT NULL AND f.id IS NULL
            `);

      if (recResults[0].orphanedrecords > 0) {
        violations.push({
          table: 'recommendations',
          constraint: 'fieldid foreign key',
          type: 'foreignkeyviolation',
          count: recResults[0].orphanedrecords,
          description: 'Recommendations with invalid fieldid references',
        });
      }
    } catch (error) {
      checks.push({
        check: 'recommendationsforeignkeys',
        status: 'error',
        error: error.message,
      });
    }

    this.results.checks.foreignkeys = checks;
    this.results.violations.push(...violations);
  }

  async checkRequiredFields() {
    console.log('Checking required fields...');

    const violations = [];

    // Check users table required fields
    try {
      const [userNulls] = await sequelize.query(`
                SELECT
                    SUM(CASE WHEN email IS NULL THEN 1 ELSE 0 END) as nullemails,
                    SUM(CASE WHEN passwordhash IS NULL THEN 1 ELSE 0 END) as nullpasswords,
                    SUM(CASE WHEN firstname IS NULL THEN 1 ELSE 0 END) as nullfirstnames
                FROM users
            `);

      if (userNulls[0].nullemails > 0) {
        violations.push({
          table: 'users',
          field: 'email',
          type: 'requiredfieldviolation',
          count: userNulls[0].nullemails,
          description: 'Users with null email addresses',
        });
      }

      if (userNulls[0].nullpasswords > 0) {
        violations.push({
          table: 'users',
          field: 'passwordhash',
          type: 'requiredfieldviolation',
          count: userNulls[0].nullpasswords,
          description: 'Users with null password hashes',
        });
      }
    } catch (error) {
      console.warn('Error checking users required fields:', error.message);
    }

    // Check fields table required fields
    try {
      const [fieldNulls] = await sequelize.query(`
                SELECT
                    SUM(CASE WHEN name IS NULL THEN 1 ELSE 0 END) as nullnames,
                    SUM(CASE WHEN userid IS NULL THEN 1 ELSE 0 END) as nulluserids,
                    SUM(CASE WHEN boundary IS NULL THEN 1 ELSE 0 END) as nullboundaries
                FROM fields
            `);

      if (fieldNulls[0].nullnames > 0) {
        violations.push({
          table: 'fields',
          field: 'name',
          type: 'requiredfieldviolation',
          count: fieldNulls[0].nullnames,
          description: 'Fields with null names',
        });
      }

      if (fieldNulls[0].nulluserids > 0) {
        violations.push({
          table: 'fields',
          field: 'userid',
          type: 'requiredfieldviolation',
          count: fieldNulls[0].nulluserids,
          description: 'Fields with null userid',
        });
      }
    } catch (error) {
      console.warn('Error checking fields required fields:', error.message);
    }

    this.results.violations.push(...violations);
  }

  async checkDataTypes() {
    console.log('Checking data types...');

    const violations = [];

    // Check email format in users table
    try {
      const [invalidEmails] = await sequelize.query(`
                SELECT COUNT(*) as invalidcount
                FROM users
                WHERE email NOT LIKE '%@%.%'
                AND email IS NOT NULL
            `);

      if (invalidEmails[0].invalidcount > 0) {
        violations.push({
          table: 'users',
          field: 'email',
          type: 'datatypeviolation',
          count: invalidEmails[0].invalidcount,
          description: 'Users with invalid email format',
        });
      }
    } catch (error) {
      console.warn('Error checking email formats:', error.message);
    }

    // Check JSON validity in boundary field
    try {
      const [invalidBoundaries] = await sequelize.query(`
                SELECT COUNT(*) as invalidcount
                FROM fields
                WHERE boundary::text NOT LIKE '{%'
                AND boundary IS NOT NULL
            `);

      if (invalidBoundaries[0].invalidcount > 0) {
        violations.push({
          table: 'fields',
          field: 'boundary',
          type: 'datatypeviolation',
          count: invalidBoundaries[0].invalidcount,
          description: 'Fields with invalid boundary JSON',
        });
      }
    } catch (error) {
      console.warn('Error checking boundary JSON:', error.message);
    }

    // Check numeric fields
    try {
      const [invalidAreas] = await sequelize.query(`
                SELECT COUNT(*) as invalidcount
                FROM fields
                WHERE area < 0
                OR area > 10000  -- Reasonable max area in hectares
                AND area IS NOT NULL
            `);

      if (invalidAreas[0].invalidcount > 0) {
        violations.push({
          table: 'fields',
          field: 'area',
          type: 'datatypeviolation',
          count: invalidAreas[0].invalidcount,
          description: 'Fields with invalid area values',
        });
      }
    } catch (error) {
      console.warn('Error checking area values:', error.message);
    }

    this.results.violations.push(...violations);
  }

  async checkReferentialIntegrity() {
    console.log('Checking referential integrity...');

    const violations = [];

    // Check for orphaned health records
    try {
      const [orphanedHealth] = await sequelize.query(`
                SELECT COUNT(*) as orphanedcount
                FROM healthdata hd
                LEFT JOIN fields f ON hd.fieldid = f.id
                WHERE f.id IS NULL
            `);

      if (orphanedHealth[0].orphanedcount > 0) {
        violations.push({
          table: 'healthdata',
          constraint: 'fieldid reference',
          type: 'referentialintegrityviolation',
          count: orphanedHealth[0].orphanedcount,
          description: 'Health data records with invalid fieldid references',
        });
      }
    } catch (error) {
      console.warn('Error checking health data referential integrity:', error.message);
    }

    // Check for orphaned yield predictions
    try {
      const [orphanedYield] = await sequelize.query(`
                SELECT COUNT(*) as orphanedcount
                FROM yieldpredictions yp
                LEFT JOIN fields f ON yp.fieldid = f.id
                WHERE f.id IS NULL
            `);

      if (orphanedYield[0].orphanedcount > 0) {
        violations.push({
          table: 'yieldpredictions',
          constraint: 'fieldid reference',
          type: 'referentialintegrityviolation',
          count: orphanedYield[0].orphanedcount,
          description: 'Yield predictions with invalid fieldid references',
        });
      }
    } catch (error) {
      console.warn('Error checking yield predictions referential integrity:', error.message);
    }

    this.results.violations.push(...violations);
  }

  async checkUniqueConstraints() {
    console.log('Checking unique constraints...');

    const violations = [];

    // Check for duplicate emails in users
    try {
      const [duplicateEmails] = await sequelize.query(`
                SELECT email, COUNT(*) as count
                FROM users
                WHERE email IS NOT NULL
                GROUP BY email
                HAVING COUNT(*) > 1
                LIMIT 5
            `);

      if (duplicateEmails.length > 0) {
        violations.push({
          table: 'users',
          constraint: 'email unique',
          type: 'uniqueconstraintviolation',
          count: duplicateEmails.length,
          description: 'Duplicate email addresses found',
          samples: duplicateEmails.map(row => row.email),
        });
      }
    } catch (error) {
      console.warn('Error checking email uniqueness:', error.message);
    }

    // Check for duplicate field names per user
    try {
      const [duplicateFields] = await sequelize.query(`
                SELECT userid, name, COUNT(*) as count
                FROM fields
                WHERE userid IS NOT NULL AND name IS NOT NULL
                GROUP BY userid, name
                HAVING COUNT(*) > 1
                LIMIT 5
            `);

      if (duplicateFields.length > 0) {
        violations.push({
          table: 'fields',
          constraint: 'userid + name unique',
          type: 'uniqueconstraintviolation',
          count: duplicateFields.length,
          description: 'Duplicate field names for same user',
          samples: duplicateFields.map(row => `${row.userid}:${row.name}`),
        });
      }
    } catch (error) {
      console.warn('Error checking field name uniqueness:', error.message);
    }

    this.results.violations.push(...violations);
  }

  async checkEnumValues() {
    console.log('Checking enum values...');

    const violations = [];

    // Check valid crop types
    const validCropTypes = ['paddy', 'wheat', 'rice', 'maize', 'soybean', 'cotton'];
    try {
      const [invalidCropTypes] = await sequelize.query(`
                SELECT croptype, COUNT(*) as count
                FROM fields
                WHERE croptype IS NOT NULL
                AND croptype NOT IN ('${validCropTypes.join("','")}')
                GROUP BY croptype
            `);

      if (invalidCropTypes.length > 0) {
        violations.push({
          table: 'fields',
          field: 'croptype',
          type: 'enumviolation',
          count: invalidCropTypes.reduce((sum, row) => sum + row.count, 0),
          description: 'Fields with invalid crop types',
          invalidvalues: invalidCropTypes.map(row => row.croptype),
        });
      }
    } catch (error) {
      console.warn('Error checking crop types:', error.message);
    }

    // Check valid health statuses
    const validHealthStatuses = ['excellent', 'good', 'fair', 'poor', 'critical'];
    try {
      const [invalidStatuses] = await sequelize.query(`
                SELECT healthstatus, COUNT(*) as count
                FROM healthdata
                WHERE healthstatus IS NOT NULL
                AND healthstatus NOT IN ('${validHealthStatuses.join("','")}')
                GROUP BY healthstatus
            `);

      if (invalidStatuses.length > 0) {
        violations.push({
          table: 'healthdata',
          field: 'healthstatus',
          type: 'enumviolation',
          count: invalidStatuses.reduce((sum, row) => sum + row.count, 0),
          description: 'Health data with invalid status values',
          invalidvalues: invalidStatuses.map(row => row.healthstatus),
        });
      }
    } catch (error) {
      console.warn('Error checking health statuses:', error.message);
    }

    this.results.violations.push(...violations);
  }

  calculateOverallStatus() {
    const violationCount = this.results.violations.length;
    const errorChecks = Object.values(this.results.checks)
      .flat()
      .filter(check => check.status === 'error');

    if (errorChecks.length > 0) {
      this.results.status = 'error';
    } else if (violationCount > 0) {
      this.results.status = 'violationsfound';
    } else {
      this.results.status = 'healthy';
    }

    this.results.summary = {
      totalviolations: violationCount,
      violationtypes: [...new Set(this.results.violations.map(v => v.type))],
      affectedtables: [...new Set(this.results.violations.map(v => v.table))],
      errorchecks: errorChecks.length,
    };
  }
}

// Run the data integrity check
if (require.main === module) {
  const checker = new DataIntegrityChecker();
  checker.run().catch(error => {
    console.error('Data integrity check script failed:', error);
    process.exit(1);
  });
}

module.exports = DataIntegrityChecker;
