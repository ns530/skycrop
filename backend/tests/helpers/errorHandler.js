/**
 * Standard error handler for integration test mock Express apps.
 * Mirrors the error handler in src/app.js so that test assertions
 * on { success, error: { code, message } } work as expected.
 */
function attachErrorHandler(app) {
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, _next) => {
    let statusCode = err.statusCode || 500;
    let code = err.code || 'INTERNALERROR';
    let { message } = err;

    if (err && (err.type === 'entity.too.large' || err.status === 413)) {
      statusCode = 413;
      code = 'PAYLOADTOOLARGE';
      message = message || 'Request entity too large';
    }

    res.status(statusCode).json({
      success: false,
      error: {
        code,
        message: message || 'An unexpected error occurred',
        details: err.details || {},
      },
      meta: { timestamp: new Date().toISOString() },
    });
  });
}

module.exports = { attachErrorHandler };
