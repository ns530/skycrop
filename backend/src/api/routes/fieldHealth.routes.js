'use strict';

const express = require('express');
const Joi = require('joi');
const { authMiddleware } = require('../middleware/auth.middleware');
const FieldHealthController = require('../controllers/fieldHealth.controller');

const router = express.Router();

// Path params schema and reusable validator for :id
const uuidParam = Joi.object({
  id: Joi.string()
    .guid({ version: ['uuidv4', 'uuidv5', 'uuidv1'] })
    .required(),
});

const validateIdParam = (req, res, next) => {
  const { error } = uuidParam.validate({ id: req.params.id });
  if (error) return next(error);
  return next();
};

// All field health endpoints require authentication
router.use(authMiddleware);

// GET /api/v1/fields/:id/health/summary
router.get('/:id/health/summary', validateIdParam, FieldHealthController.show);

module.exports = router;
