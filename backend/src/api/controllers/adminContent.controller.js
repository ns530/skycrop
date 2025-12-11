'use strict';

const { sequelize } = require('../../config/database.config');
const { ValidationError, NotFoundError } = require('../../errors/custom-errors');
const { logger } = require('../../utils/logger');

/**
 * Admin Content Controller
 * Manages content items (news, articles, etc.) for admin users
 */
module.exports = {
  /**
   * GET /api/v1/admin/content
   * Get paginated list of content items
   */
  async getContent(req, res, next) {
    try {
      const { page = 1, pageSize = 12, status, search } = req.query;
      const offset = (page - 1) * pageSize;

      let whereClause = '';
      const replacements = { limit: pageSize, offset };

      if (status) {
        whereClause += ' AND status = :status';
        replacements.status = status;
      }

      if (search) {
        whereClause += ' AND (title ILIKE :search OR summary ILIKE :search OR body ILIKE :search)';
        replacements.search = `%${search}%`;
      }

      // Get content items
      const [results] = await sequelize.query(
        `
        SELECT
          content_id as id,
          title,
          summary,
          body,
          status,
          published_at,
          created_at,
          updated_at
        FROM content
        WHERE 1=1 ${whereClause}
        ORDER BY created_at DESC
        LIMIT :limit OFFSET :offset
        `,
        { replacements }
      );

      // Get total count
      const [countResult] = await sequelize.query(
        `
        SELECT COUNT(*) as total
        FROM content
        WHERE 1=1 ${whereClause}
        `,
        { replacements: { status: replacements.status, search: replacements.search } }
      );

      const total = parseInt(countResult[0].total, 10);

      return res.status(200).json({
        success: true,
        data: results,
        pagination: {
          page: parseInt(page, 10),
          pageSize: parseInt(pageSize, 10),
          total,
          totalPages: Math.ceil(total / pageSize),
        },
        meta: {
          correlation_id: req.headers['x-request-id'],
        },
      });
    } catch (err) {
      return next(err);
    }
  },

  /**
   * POST /api/v1/admin/content
   * Create new content item
   */
  async createContent(req, res, next) {
    try {
      const { title, summary, body, status, published_at } = req.body;
      const userId = req.user.userId;

      const [result] = await sequelize.query(
        `
        INSERT INTO content (title, summary, body, status, published_at, created_by, created_at, updated_at)
        VALUES (:title, :summary, :body, :status, :published_at, :created_by, NOW(), NOW())
        RETURNING
          content_id as id,
          title,
          summary,
          body,
          status,
          published_at,
          created_at,
          updated_at
        `,
        {
          replacements: {
            title,
            summary,
            body,
            status: status || 'draft',
            published_at: published_at || null,
            created_by: userId,
          },
        }
      );

      logger.info('admin.content.created', {
        content_id: result.id,
        user_id: userId,
        title: result.title,
      });

      return res.status(201).json({
        success: true,
        data: result,
        meta: {
          correlation_id: req.headers['x-request-id'],
        },
      });
    } catch (err) {
      return next(err);
    }
  },

  /**
   * GET /api/v1/admin/content/:id
   * Get content item by ID
   */
  async getContentById(req, res, next) {
    try {
      const { id } = req.params;

      const [results] = await sequelize.query(
        `
        SELECT
          content_id as id,
          title,
          summary,
          body,
          status,
          published_at,
          created_at,
          updated_at
        FROM content
        WHERE content_id = :id
        `,
        { replacements: { id } }
      );

      if (results.length === 0) {
        throw new NotFoundError('Content item not found');
      }

      return res.status(200).json({
        success: true,
        data: results[0],
        meta: {
          correlation_id: req.headers['x-request-id'],
        },
      });
    } catch (err) {
      return next(err);
    }
  },

  /**
   * PUT /api/v1/admin/content/:id
   * Update content item
   */
  async updateContent(req, res, next) {
    try {
      const { id } = req.params;
      const { title, summary, body, status, published_at } = req.body;
      const userId = req.user.userId;

      const [result] = await sequelize.query(
        `
        UPDATE content
        SET
          title = :title,
          summary = :summary,
          body = :body,
          status = :status,
          published_at = :published_at,
          updated_at = NOW()
        WHERE content_id = :id
        RETURNING
          content_id as id,
          title,
          summary,
          body,
          status,
          published_at,
          created_at,
          updated_at
        `,
        {
          replacements: {
            id,
            title,
            summary,
            body,
            status,
            published_at: published_at || null,
          },
        }
      );

      if (result.length === 0) {
        throw new NotFoundError('Content item not found');
      }

      logger.info('admin.content.updated', {
        content_id: id,
        user_id: userId,
        title: result[0].title,
      });

      return res.status(200).json({
        success: true,
        data: result[0],
        meta: {
          correlation_id: req.headers['x-request-id'],
        },
      });
    } catch (err) {
      return next(err);
    }
  },

  /**
   * DELETE /api/v1/admin/content/:id
   * Delete content item
   */
  async deleteContent(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const [result] = await sequelize.query(
        `
        DELETE FROM content
        WHERE content_id = :id
        RETURNING content_id, title
        `,
        { replacements: { id } }
      );

      if (result.length === 0) {
        throw new NotFoundError('Content item not found');
      }

      logger.info('admin.content.deleted', {
        content_id: id,
        user_id: userId,
        title: result[0].title,
      });

      return res.status(200).json({
        success: true,
        data: { deleted: true },
        meta: {
          correlation_id: req.headers['x-request-id'],
        },
      });
    } catch (err) {
      return next(err);
    }
  },
};