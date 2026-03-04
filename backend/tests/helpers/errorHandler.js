/**
 * Standard error handler for integration test mock Express apps.
 * Mirrors the error handler in src/app.js so that test assertions
 * on { success, error: { code, message } } work as expected.
 */
function attachErrorHandler(app) {
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err && (err.type === 'entity.too.large' || err.status === 413)) {
      err.statusCode = 413;
      err.code = 'PAYLOADTOOLARGE';
      err.message = err.message || 'Request entity too large';
    }

    const status = err.statusCode || 500;
    const code = err.code || 'INTERNALERROR';

    res.status(status).json({
      success: false,
      error: {
        code,
        message: err.message || 'An unexpected error occurred',
        details: err.details || {},
      },
      meta: { timestamp: new Date().toISOString() },
    });
  });
}

module.exports = { attachErrorHandler };
