const { sequelize } = require('../../config/database.config');
const { NotFoundError } = require('../../errors/custom-errors');
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
          contentid as id,
          title,
          summary,
          body,
          status,
          publishedat,
          createdat,
          updatedat
        FROM content
        WHERE 1=1 ${whereClause}
        ORDER BY createdat DESC
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
          correlationid: req.headers['x-request-id'],
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
      const { title, summary, body, status, publishedat } = req.body;
      const { user_id: userId } = req.user;

      const [result] = await sequelize.query(
        `
        INSERT INTO content (title, summary, body, status, publishedat, createdby, createdat, updatedat)
        VALUES (:title, :summary, :body, :status, :publishedat, :createdby, NOW(), NOW())
        RETURNING
          contentid as id,
          title,
          summary,
          body,
          status,
          publishedat,
          createdat,
          updatedat
        `,
        {
          replacements: {
            title,
            summary,
            body,
            status: status || 'draft',
            publishedat: publishedat || null,
            createdby: userId,
          },
        }
      );

      logger.info('admin.content.created', {
        contentid: result.id,
        userId,
        title: result.title,
      });

      return res.status(201).json({
        success: true,
        data: result,
        meta: {
          correlationid: req.headers['x-request-id'],
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
          contentid as id,
          title,
          summary,
          body,
          status,
          publishedat,
          createdat,
          updatedat
        FROM content
        WHERE contentid = :id
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
          correlationid: req.headers['x-request-id'],
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
      const { title, summary, body, status, publishedat } = req.body;
      const { user_id: userId } = req.user;

      const [result] = await sequelize.query(
        `
        UPDATE content
        SET
          title = :title,
          summary = :summary,
          body = :body,
          status = :status,
          publishedat = :publishedat,
          updatedat = NOW()
        WHERE contentid = :id
        RETURNING
          contentid as id,
          title,
          summary,
          body,
          status,
          publishedat,
          createdat,
          updatedat
        `,
        {
          replacements: {
            id,
            title,
            summary,
            body,
            status,
            publishedat: publishedat || null,
          },
        }
      );

      if (result.length === 0) {
        throw new NotFoundError('Content item not found');
      }

      logger.info('admin.content.updated', {
        contentid: id,
        userId,
        title: result[0].title,
      });

      return res.status(200).json({
        success: true,
        data: result[0],
        meta: {
          correlationid: req.headers['x-request-id'],
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
      const { user_id: userId } = req.user;

      const [result] = await sequelize.query(
        `
        DELETE FROM content
        WHERE contentid = :id
        RETURNING contentid, title
        `,
        { replacements: { id } }
      );

      if (result.length === 0) {
        throw new NotFoundError('Content item not found');
      }

      logger.info('admin.content.deleted', {
        contentid: id,
        userId,
        title: result[0].title,
      });

      return res.status(200).json({
        success: true,
        data: { deleted: true },
        meta: {
          correlationid: req.headers['x-request-id'],
        },
      });
    } catch (err) {
      return next(err);
    }
  },
};
