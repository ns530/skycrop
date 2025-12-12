const express = require('express');
const Joi = require('joi');
const FieldController = require('../controllers/field.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { validateRequest } = require('../middleware/validation.middleware');
const { apiLimiter } = require('../middleware/rateLimit.middleware');

const router = express.Router();

// Schemas
const uuidParam = Joi.object({
  id: Joi.string()
    .guid({ version: ['uuidv4', 'uuidv5', 'uuidv1'] })
    .required(),
});

// Reusable params validator for :id
const validateIdParam = (req, res, next) => {
  const { error } = uuidParam.validate({ id: req.params.id });
  if (error) return next(error);
  return next();
};

const geoJsonBoundary = Joi.object({
  type: Joi.string().valid('Polygon', 'MultiPolygon').required(),
  coordinates: Joi.array().required(),
}).required();

const createFieldBody = Joi.object({
  name: Joi.string().min(1).max(50).required(),
  boundary: geoJsonBoundary,
});

const updateFieldBody = Joi.object({
  name: Joi.string().min(1).max(50).optional(),
  status: Joi.string().valid('active', 'archived', 'deleted').optional(),
}).min(1);

const listQuery = Joi.object({
  bbox: Joi.string()
    .pattern(/^-?\d{1,3}\.\d+,-?\d{1,2}\.\d+,-?\d{1,3}\.\d+,-?\d{1,2}\.\d+$/)
    .optional(),
  near: Joi.string()
    .pattern(/^-?\d{1,2}\.\d+,-?\d{1,3}\.\d+,\d{1,6}$/)
    .optional(),
  intersects: Joi.string().optional(),
  page: Joi.number().integer().min(1).default(1),
  pagesize: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().valid('name', 'createdat', 'areasqm').default('createdat'),
  order: Joi.string().valid('asc', 'desc').default('desc'),
});

// Routes (all protected)
router.use(authMiddleware);
router.use(apiLimiter);

// GET /api/v1/fields
router.get('/', validateRequest(listQuery, 'query'), FieldController.list);

// POST /api/v1/fields
router.post('/', validateRequest(createFieldBody), FieldController.create);

// GET /api/v1/fields/:id
router.get('/:id', validateIdParam, FieldController.getById);

// PATCH /api/v1/fields/:id
router.patch('/:id', validateIdParam, validateRequest(updateFieldBody), FieldController.update);

// DELETE /api/v1/fields/:id
router.delete('/:id', validateIdParam, FieldController.remove);

module.exports = router;
