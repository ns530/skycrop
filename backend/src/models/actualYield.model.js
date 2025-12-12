const Sequelize = require('sequelize');
const { sequelize } = require('../config/database.config');

/**
 * ActualYield Model
 * Mirrors PostgreSQL "actualyields" table for farmer-entered harvest data
 *
 * Columns:
 * - yieldid UUID PK
 * - field_id UUID FK
 * - user_id UUID FK
 * - actualyieldperha DECIMAL(10,2) NOT NULL
 * - totalyieldkg DECIMAL(10,2) NOT NULL
 * - harvestdate DATE NOT NULL
 * - predictionid UUID FK (nullable, links to yieldpredictions)
 * - predictedyieldperha DECIMAL(10,2) (nullable)
 * - accuracymape DECIMAL(5,2) (nullable, auto-calculated by trigger)
 * - notes TEXT (nullable)
 * - cropvariety VARCHAR(100) (nullable)
 * - season VARCHAR(20) (nullable: maha, yala, other)
 * - createdat TIMESTAMP DEFAULT NOW()
 * - updatedat TIMESTAMP DEFAULT NOW()
 *
 * Indexes:
 * - (field_id, harvestdate DESC)
 * - (user_id, harvestdate DESC)
 * - (season, harvestdate DESC)
 * - UNIQUE (field_id, harvestdate)
 *
 * Triggers:
 * - Auto-calculate accuracymape if prediction exists
 * - Auto-update updatedat on modification
 */
const ActualYield = sequelize.define(
  'ActualYield',
  {
    yieldid: {
      type: Sequelize.DataTypes.UUID,
      defaultValue: Sequelize.DataTypes.UUIDV4,
      primaryKey: true,
    },
    field_id: {
      type: Sequelize.DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'fields',
        key: 'field_id',
      },
    },
    user_id: {
      type: Sequelize.DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id',
      },
    },
    actualyieldperha: {
      type: Sequelize.DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
        isDecimal: true,
      },
    },
    totalyieldkg: {
      type: Sequelize.DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
        isDecimal: true,
      },
    },
    harvestdate: {
      type: Sequelize.DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true,
        isNotFuture(value) {
          if (new Date(value) > new Date()) {
            throw new Error('Harvest date cannot be in the future');
          }
        },
      },
    },
    predictionid: {
      type: Sequelize.DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'yieldpredictions',
        key: 'predictionid',
      },
    },
    predictedyieldperha: {
      type: Sequelize.DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0,
        isDecimal: true,
      },
    },
    accuracymape: {
      type: Sequelize.DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 100,
        isDecimal: true,
      },
    },
    notes: {
      type: Sequelize.DataTypes.TEXT,
      allowNull: true,
    },
    cropvariety: {
      type: Sequelize.DataTypes.STRING(100),
      allowNull: true,
    },
    season: {
      type: Sequelize.DataTypes.ENUM('maha', 'yala', 'other'),
      allowNull: true,
    },
    createdat: {
      type: Sequelize.DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.DataTypes.NOW,
    },
    updatedat: {
      type: Sequelize.DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.DataTypes.NOW,
    },
  },
  {
    tableName: 'actualyields',
    timestamps: true,
    createdAt: 'createdat',
    updatedAt: 'updatedat',
    underscored: true,
    freezeTableName: true,
    indexes: [
      // Field + harvest date for history queries
      { fields: ['field_id', { name: 'harvestdate', order: 'DESC' }] },
      // User + harvest date for user's all yields
      { fields: ['user_id', { name: 'harvestdate', order: 'DESC' }] },
      // Season-based queries
      { fields: ['season', { name: 'harvestdate', order: 'DESC' }] },
      // Unique constraint: one entry per field per harvest date
      {
        unique: true,
        fields: ['field_id', 'harvestdate'],
        name: 'idxactualyieldsfieldharvestunique',
      },
      // Prediction lookup
      { fields: ['predictionid'], where: { predictionid: { [Sequelize.Op.ne]: null } } },
    ],
  }
);

/**
 * Associations (to be called in model index/initialization)
 */
ActualYield.associate = models => {
  // Belongs to Field
  ActualYield.belongsTo(models.Field, {
    foreignKey: 'field_id',
    as: 'field',
  });

  // Belongs to User
  ActualYield.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'farmer',
  });

  // Optional: Belongs to YieldPrediction (for accuracy tracking)
  if (models.YieldPrediction) {
    ActualYield.belongsTo(models.YieldPrediction, {
      foreignKey: 'predictionid',
      as: 'prediction',
    });
  }
};

module.exports = ActualYield;
