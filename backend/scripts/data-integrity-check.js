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
            summary: {}
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
                SELECT COUNT(*) as orphaned_records
                FROM users u
                LEFT JOIN user_roles ur ON u.role_id = ur.id
                WHERE u.role_id IS NOT NULL AND ur.id IS NULL
            `);

            if (userResults[0].orphaned_records > 0) {
                violations.push({
                    table: 'users',
                    constraint: 'role_id foreign key',
                    type: 'foreign_key_violation',
                    count: userResults[0].orphaned_records,
                    description: 'Users with invalid role_id references'
                });
            }
        } catch (error) {
            checks.push({
                check: 'users_foreign_keys',
                status: 'error',
                error: error.message
            });
        }

        // Check fields table foreign keys
        try {
            const [fieldResults] = await sequelize.query(`
                SELECT COUNT(*) as orphaned_records
                FROM fields f
                LEFT JOIN users u ON f.user_id = u.id
                WHERE f.user_id IS NOT NULL AND u.id IS NULL
            `);

            if (fieldResults[0].orphaned_records > 0) {
                violations.push({
                    table: 'fields',
                    constraint: 'user_id foreign key',
                    type: 'foreign_key_violation',
                    count: fieldResults[0].orphaned_records,
                    description: 'Fields with invalid user_id references'
                });
            }
        } catch (error) {
            checks.push({
                check: 'fields_foreign_keys',
                status: 'error',
                error: error.message
            });
        }

        // Check recommendations table foreign keys
        try {
            const [recResults] = await sequelize.query(`
                SELECT COUNT(*) as orphaned_records
                FROM recommendations r
                LEFT JOIN fields f ON r.field_id = f.id
                WHERE r.field_id IS NOT NULL AND f.id IS NULL
            `);

            if (recResults[0].orphaned_records > 0) {
                violations.push({
                    table: 'recommendations',
                    constraint: 'field_id foreign key',
                    type: 'foreign_key_violation',
                    count: recResults[0].orphaned_records,
                    description: 'Recommendations with invalid field_id references'
                });
            }
        } catch (error) {
            checks.push({
                check: 'recommendations_foreign_keys',
                status: 'error',
                error: error.message
            });
        }

        this.results.checks.foreign_keys = checks;
        this.results.violations.push(...violations);
    }

    async checkRequiredFields() {
        console.log('Checking required fields...');

        const violations = [];

        // Check users table required fields
        try {
            const [userNulls] = await sequelize.query(`
                SELECT
                    SUM(CASE WHEN email IS NULL THEN 1 ELSE 0 END) as null_emails,
                    SUM(CASE WHEN password_hash IS NULL THEN 1 ELSE 0 END) as null_passwords,
                    SUM(CASE WHEN first_name IS NULL THEN 1 ELSE 0 END) as null_first_names
                FROM users
            `);

            if (userNulls[0].null_emails > 0) {
                violations.push({
                    table: 'users',
                    field: 'email',
                    type: 'required_field_violation',
                    count: userNulls[0].null_emails,
                    description: 'Users with null email addresses'
                });
            }

            if (userNulls[0].null_passwords > 0) {
                violations.push({
                    table: 'users',
                    field: 'password_hash',
                    type: 'required_field_violation',
                    count: userNulls[0].null_passwords,
                    description: 'Users with null password hashes'
                });
            }
        } catch (error) {
            console.warn('Error checking users required fields:', error.message);
        }

        // Check fields table required fields
        try {
            const [fieldNulls] = await sequelize.query(`
                SELECT
                    SUM(CASE WHEN name IS NULL THEN 1 ELSE 0 END) as null_names,
                    SUM(CASE WHEN user_id IS NULL THEN 1 ELSE 0 END) as null_user_ids,
                    SUM(CASE WHEN boundary IS NULL THEN 1 ELSE 0 END) as null_boundaries
                FROM fields
            `);

            if (fieldNulls[0].null_names > 0) {
                violations.push({
                    table: 'fields',
                    field: 'name',
                    type: 'required_field_violation',
                    count: fieldNulls[0].null_names,
                    description: 'Fields with null names'
                });
            }

            if (fieldNulls[0].null_user_ids > 0) {
                violations.push({
                    table: 'fields',
                    field: 'user_id',
                    type: 'required_field_violation',
                    count: fieldNulls[0].null_user_ids,
                    description: 'Fields with null user_id'
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
                SELECT COUNT(*) as invalid_count
                FROM users
                WHERE email NOT LIKE '%@%.%'
                AND email IS NOT NULL
            `);

            if (invalidEmails[0].invalid_count > 0) {
                violations.push({
                    table: 'users',
                    field: 'email',
                    type: 'data_type_violation',
                    count: invalidEmails[0].invalid_count,
                    description: 'Users with invalid email format'
                });
            }
        } catch (error) {
            console.warn('Error checking email formats:', error.message);
        }

        // Check JSON validity in boundary field
        try {
            const [invalidBoundaries] = await sequelize.query(`
                SELECT COUNT(*) as invalid_count
                FROM fields
                WHERE boundary::text NOT LIKE '{%'
                AND boundary IS NOT NULL
            `);

            if (invalidBoundaries[0].invalid_count > 0) {
                violations.push({
                    table: 'fields',
                    field: 'boundary',
                    type: 'data_type_violation',
                    count: invalidBoundaries[0].invalid_count,
                    description: 'Fields with invalid boundary JSON'
                });
            }
        } catch (error) {
            console.warn('Error checking boundary JSON:', error.message);
        }

        // Check numeric fields
        try {
            const [invalidAreas] = await sequelize.query(`
                SELECT COUNT(*) as invalid_count
                FROM fields
                WHERE area < 0
                OR area > 10000  -- Reasonable max area in hectares
                AND area IS NOT NULL
            `);

            if (invalidAreas[0].invalid_count > 0) {
                violations.push({
                    table: 'fields',
                    field: 'area',
                    type: 'data_type_violation',
                    count: invalidAreas[0].invalid_count,
                    description: 'Fields with invalid area values'
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
                SELECT COUNT(*) as orphaned_count
                FROM health_data hd
                LEFT JOIN fields f ON hd.field_id = f.id
                WHERE f.id IS NULL
            `);

            if (orphanedHealth[0].orphaned_count > 0) {
                violations.push({
                    table: 'health_data',
                    constraint: 'field_id reference',
                    type: 'referential_integrity_violation',
                    count: orphanedHealth[0].orphaned_count,
                    description: 'Health data records with invalid field_id references'
                });
            }
        } catch (error) {
            console.warn('Error checking health data referential integrity:', error.message);
        }

        // Check for orphaned yield predictions
        try {
            const [orphanedYield] = await sequelize.query(`
                SELECT COUNT(*) as orphaned_count
                FROM yield_predictions yp
                LEFT JOIN fields f ON yp.field_id = f.id
                WHERE f.id IS NULL
            `);

            if (orphanedYield[0].orphaned_count > 0) {
                violations.push({
                    table: 'yield_predictions',
                    constraint: 'field_id reference',
                    type: 'referential_integrity_violation',
                    count: orphanedYield[0].orphaned_count,
                    description: 'Yield predictions with invalid field_id references'
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
                    type: 'unique_constraint_violation',
                    count: duplicateEmails.length,
                    description: 'Duplicate email addresses found',
                    samples: duplicateEmails.map(row => row.email)
                });
            }
        } catch (error) {
            console.warn('Error checking email uniqueness:', error.message);
        }

        // Check for duplicate field names per user
        try {
            const [duplicateFields] = await sequelize.query(`
                SELECT user_id, name, COUNT(*) as count
                FROM fields
                WHERE user_id IS NOT NULL AND name IS NOT NULL
                GROUP BY user_id, name
                HAVING COUNT(*) > 1
                LIMIT 5
            `);

            if (duplicateFields.length > 0) {
                violations.push({
                    table: 'fields',
                    constraint: 'user_id + name unique',
                    type: 'unique_constraint_violation',
                    count: duplicateFields.length,
                    description: 'Duplicate field names for same user',
                    samples: duplicateFields.map(row => `${row.user_id}:${row.name}`)
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
                SELECT crop_type, COUNT(*) as count
                FROM fields
                WHERE crop_type IS NOT NULL
                AND crop_type NOT IN ('${validCropTypes.join("','")}')
                GROUP BY crop_type
            `);

            if (invalidCropTypes.length > 0) {
                violations.push({
                    table: 'fields',
                    field: 'crop_type',
                    type: 'enum_violation',
                    count: invalidCropTypes.reduce((sum, row) => sum + row.count, 0),
                    description: 'Fields with invalid crop types',
                    invalid_values: invalidCropTypes.map(row => row.crop_type)
                });
            }
        } catch (error) {
            console.warn('Error checking crop types:', error.message);
        }

        // Check valid health statuses
        const validHealthStatuses = ['excellent', 'good', 'fair', 'poor', 'critical'];
        try {
            const [invalidStatuses] = await sequelize.query(`
                SELECT health_status, COUNT(*) as count
                FROM health_data
                WHERE health_status IS NOT NULL
                AND health_status NOT IN ('${validHealthStatuses.join("','")}')
                GROUP BY health_status
            `);

            if (invalidStatuses.length > 0) {
                violations.push({
                    table: 'health_data',
                    field: 'health_status',
                    type: 'enum_violation',
                    count: invalidStatuses.reduce((sum, row) => sum + row.count, 0),
                    description: 'Health data with invalid status values',
                    invalid_values: invalidStatuses.map(row => row.health_status)
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
            this.results.status = 'violations_found';
        } else {
            this.results.status = 'healthy';
        }

        this.results.summary = {
            total_violations: violationCount,
            violation_types: [...new Set(this.results.violations.map(v => v.type))],
            affected_tables: [...new Set(this.results.violations.map(v => v.table))],
            error_checks: errorChecks.length
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