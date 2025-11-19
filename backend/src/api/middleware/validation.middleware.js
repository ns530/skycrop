'use strict';

const Joi = require('joi');
const { ValidationError } = require('../../errors/custom-errors');

/**
 * Generic request validation middleware
 * @param {Joi.ObjectSchema} schema - Joi schema to validate against
 * @param {'body'|'query'|'params'} source - Where to read data from
 */
function validateRequest(schema, source = 'body') {
  return (req, _res, next) => {
    const input =
      source === 'query' ? req.query :
      source === 'params' ? req.params :
      req.body;

    const { error, value } = schema.validate(input, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message,
      }));
      return next(new ValidationError('Invalid request data', { errors: details }));
    }

    if (source === 'query') {
      req.query = value;
    } else if (source === 'params') {
      req.params = value;
    } else {
      req.body = value;
    }
    return next();
  };
}

// Password strength: min 8 chars, 1 uppercase, 1 lowercase, 1 number
const passwordSchema = Joi.string()
  .min(8)
  .pattern(/[A-Z]/, 'uppercase')
  .pattern(/[a-z]/, 'lowercase')
  .pattern(/[0-9]/, 'number')
  .messages({
    'string.min': 'Password must be at least 8 characters',
    'string.pattern.name': 'Password must include at least one {#name} letter',
  });

const signup = Joi.object({
  email: Joi.string().email().max(255).required(),
  password: passwordSchema.required(),
  name: Joi.string().min(1).max(50).required(),
});

const login = Joi.object({
  email: Joi.string().email().max(255).required(),
  password: Joi.string().required(),
});

const requestPasswordReset = Joi.object({
  email: Joi.string().email().max(255).required(),
});

const resetPassword = Joi.object({
  token: Joi.string().required(),
  newPassword: passwordSchema.required(),
});

const allowedBands = ['RGB', 'NIR', 'SWIR', 'RED', 'GREEN', 'BLUE'];

// Satellite tiles GET validation
const satelliteTileParams = Joi.object({
  z: Joi.number().integer().min(0).max(22).required(),
  x: Joi.number().integer().min(0).required(),
  y: Joi.number().integer().min(0).required(),
});

const satelliteTileQuery = Joi.object({
  date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required()
    .messages({ 'string.pattern.base': 'date must be YYYY-MM-DD' }),
  bands: Joi.string()
    .custom((value, helpers) => {
      const parts = String(value || 'RGB').toUpperCase().split(',').map((s) => s.trim()).filter(Boolean);
      if (!parts.length) return helpers.error('any.invalid', { message: 'bands cannot be empty' });
      for (const p of parts) {
        if (!allowedBands.includes(p)) {
          return helpers.error('any.invalid', { message: `Invalid band '${p}'. Allowed: ${allowedBands.join(', ')}` });
        }
      }
      return parts.join(',');
    })
    .default('RGB'),
  cloud_lt: Joi.number().integer().min(0).max(100).default(20),
});

// Satellite preprocess POST validation
const satellitePreprocess = Joi.object({
  bbox: Joi.array()
    .items(Joi.number().required())
    .length(4)
    .required()
    .custom((arr, helpers) => {
      const [minLon, minLat, maxLon, maxLat] = arr;
      if (minLon >= maxLon || minLat >= maxLat) {
        return helpers.error('any.invalid', { message: 'bbox extents invalid; min must be less than max' });
      }
      if (minLon < -180 || maxLon > 180 || minLat < -90 || maxLat > 90) {
        return helpers.error('any.invalid', { message: 'bbox coordinates out of SRID 4326 range' });
      }
      return arr;
    }),
  date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required()
    .messages({ 'string.pattern.base': 'date must be YYYY-MM-DD' }),
  bands: Joi.array()
    .items(Joi.string().valid(...allowedBands))
    .default(['RGB']),
  cloud_mask: Joi.boolean().optional(),
  idempotencyKey: Joi.string().max(200).optional(),
});

/**
 * ML Segmentation Predict POST validation
 * One of: bbox OR field_id; date required; optional model_version (semver)
 * tiling defaults: { size:512, overlap:64 }, return: "mask_url" | "inline"
 */
const mlBBox = Joi.array()
  .items(Joi.number().required())
  .length(4)
  .custom((arr, helpers) => {
    const [minLon, minLat, maxLon, maxLat] = arr.map(Number);
    if (!arr.every((v) => Number.isFinite(v))) {
      return helpers.error('any.invalid', { message: 'bbox values must be numeric' });
    }
    if (minLon >= maxLon || minLat >= maxLat) {
      return helpers.error('any.invalid', { message: 'bbox extents invalid; min must be less than max' });
    }
    if (minLon < -180 || maxLon > 180 || minLat < -90 || maxLat > 90) {
      return helpers.error('any.invalid', { message: 'bbox coordinates out of SRID 4326 range' });
    }
    return [minLon, minLat, maxLon, maxLat];
  });

const mlPredict = Joi.object({
  bbox: mlBBox.optional(),
  field_id: Joi.string()
    .guid({ version: ['uuidv4', 'uuidv5', 'uuidv1'] })
    .optional(),
  date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required()
    .messages({ 'string.pattern.base': 'date must be YYYY-MM-DD' }),
  model_version: Joi.string()
    .pattern(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/)
    .optional(),
  tiling: Joi.object({
    size: Joi.number().integer().min(1).max(4096).default(512),
    overlap: Joi.number().integer().min(0).max(1024).default(64),
  }).default({ size: 512, overlap: 64 }),
  return: Joi.string().valid('mask_url', 'inline').default('mask_url'),
})
  .custom((val, helpers) => {
    const hasBBox = Array.isArray(val.bbox);
    const hasField = typeof val.field_id === 'string';
    if ((hasBBox && hasField) || (!hasBBox && !hasField)) {
      return helpers.error('any.invalid', { message: 'Provide exactly one of bbox or field_id' });
    }
    return val;
  })
  .prefs({ abortEarly: false, stripUnknown: true });
 
// ---------------- Health indices (Sprint 3) ----------------
const healthCompute = Joi.object({
  date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required()
    .messages({ 'string.pattern.base': 'date must be YYYY-MM-DD' }),
  recompute: Joi.boolean().default(false),
}).prefs({ abortEarly: false, stripUnknown: true });

const healthList = Joi.object({
  from: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .messages({ 'string.pattern.base': 'from must be YYYY-MM-DD' })
    .optional(),
  to: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .messages({ 'string.pattern.base': 'to must be YYYY-MM-DD' })
    .optional(),
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(20),
})
  .custom((val, helpers) => {
    if (val.from && val.to && val.from > val.to) {
      return helpers.error('any.invalid', { message: 'from must be <= to' });
    }
    return val;
  }, 'date range validation')
  .prefs({ abortEarly: false, stripUnknown: true });

// ---------------- Recommendations (Sprint 3) ----------------
const recommendationCompute = Joi.object({
  date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required()
    .messages({ 'string.pattern.base': 'date must be YYYY-MM-DD' }),
  recompute: Joi.boolean().default(false),
}).prefs({ abortEarly: false, stripUnknown: true });

const recommendationList = Joi.object({
  from: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .messages({ 'string.pattern.base': 'from must be YYYY-MM-DD' })
    .optional(),
  to: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .messages({ 'string.pattern.base': 'to must be YYYY-MM-DD' })
    .optional(),
  type: Joi.string().valid('water', 'fertilizer').optional(),
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(20),
})
  .custom((val, helpers) => {
    if (val.from && val.to && val.from > val.to) {
      return helpers.error('any.invalid', { message: 'from must be <= to' });
    }
    return val;
  }, 'date range validation')
  .prefs({ abortEarly: false, stripUnknown: true });

// Yield prediction validation
const yieldPredict = Joi.object({
  features: Joi.array()
    .items(Joi.object({
      field_id: Joi.string()
        .guid({ version: ['uuidv4', 'uuidv5', 'uuidv1'] })
        .required(),
    }).pattern(/^[a-zA-Z_][a-zA-Z0-9_]*$/, Joi.number().required()))
    .optional(),
  rows: Joi.array()
    .items(Joi.array().items(Joi.number().required()))
    .optional(),
  feature_names: Joi.array()
    .items(Joi.string().pattern(/^[a-zA-Z_][a-zA-Z0-9_]*$/))
    .optional(),
  model_version: Joi.string()
    .pattern(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/)
    .optional(),
})
  .custom((val, helpers) => {
    const hasFeatures = Array.isArray(val.features);
    const hasRows = Array.isArray(val.rows);
    const hasFeatureNames = Array.isArray(val.feature_names);

    if (hasFeatures && (hasRows || hasFeatureNames)) {
      return helpers.error('any.invalid', { message: 'Provide either features OR rows with feature_names, not both' });
    }
    if (!hasFeatures && hasRows && !hasFeatureNames) {
      return helpers.error('any.invalid', { message: 'rows requires feature_names' });
    }
    if (!hasFeatures && !hasRows) {
      return helpers.error('any.invalid', { message: 'Provide either features or rows with feature_names' });
    }
    if (hasRows && hasFeatureNames && val.rows.length > 0 && val.feature_names.length !== val.rows[0].length) {
      return helpers.error('any.invalid', { message: 'feature_names length must match rows[0] length' });
    }
    return val;
  })
  .prefs({ abortEarly: false, stripUnknown: true });

 module.exports = {
 validateRequest,
 schemas: {
   signup,
   login,
   requestPasswordReset,
   resetPassword,
   satelliteTileParams,
   satelliteTileQuery,
   satellitePreprocess,
   mlPredict,
   yieldPredict,
   healthCompute,
   healthList,
   recommendationCompute,
   recommendationList,
 },
};