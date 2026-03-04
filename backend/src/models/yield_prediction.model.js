const { DataTypes, literal } = require('sequelize');
const { sequelize } = require('../config/database.config');

/**
 * YieldPrediction Model
 * Mirrors PostgreSQL "yieldpredictions" defined in backend/database/init.sql
 *
 * Columns:
 * - predictionid UUID PK
 * - field_id UUID FK
 * - predictiondate DATE
 * - predictedyieldperha DECIMAL(10,2)
 * - predictedtotalyield DECIMAL(10,2)
 * - confidencelower DECIMAL(10,2)
 * - confidenceupper DECIMAL(10,2)
 * - expectedrevenue DECIMAL(12,2)
 * - harvestdateestimate DATE (nullable)
 * - modelversion VARCHAR(20)
 * - featuresused JSONB
 * - actualyield DECIMAL(10,2) (nullable)
 * - accuracymape DECIMAL(5,2) (nullable)
 * - createdat TIMESTAMP DEFAULT NOW()
 *
 * Indexes:
 * - (field_id, predictiondate DESC)
 * - (harvestdateestimate)
 */
const YieldPrediction = sequelize.define(
  'YieldPrediction',
  {
    predictionid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      field: 'prediction_id',
    },
    field_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    predictiondate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'prediction_date',
    },
    predictedyieldperha: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: { min: 0 },
      field: 'predicted_yield_per_ha',
    },
    predictedtotalyield: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: { min: 0 },
      field: 'predicted_total_yield',
    },
    confidencelower: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'confidence_lower',
    },
    confidenceupper: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'confidence_upper',
    },
    expectedrevenue: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: { min: 0 },
      field: 'expected_revenue',
    },
    harvestdateestimate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'harvest_date_estimate',
    },
    modelversion: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'model_version',
    },
    featuresused: {
      type: DataTypes.JSONB,
      allowNull: false,
      field: 'features_used',
    },
    actualyield: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: { min: 0 },
      field: 'actual_yield',
    },
    accuracymape: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      field: 'accuracy_mape',
    },
    createdat: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: literal('NOW()'),
      field: 'created_at',
    },
  },
  {
    tableName: 'yield_predictions',
    timestamps: false, // only createdat is present
    underscored: true,
    freezeTableName: true,
    indexes: [
      { fields: ['field_id', { name: 'predictiondate', order: 'DESC' }] },
      { fields: ['harvestdateestimate'] },
    ],
  }
);

// Optional association placeholder
// YieldPrediction.associate = (models) => {
//   YieldPrediction.belongsTo(models.Field, { foreignKey: 'field_id', as: 'field' });
// };

module.exports = YieldPrediction;
