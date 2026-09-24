let app;
let initError = null;

try {
  app = require('../server/src/index');
} catch (err) {
  initError = {
    message: err.message,
    stack: err.stack
  };
}

module.exports = (req, res) => {
  if (initError) {
    return res.status(200).json({
      success: false,
      error: 'INIT_ERROR',
      details: initError
    });
  }
  try {
    return app(req, res);
  } catch (err) {
    return res.status(200).json({
      success: false,
      error: 'RUNTIME_ERROR',
      message: err.message,
      stack: err.stack
    });
  }
};
