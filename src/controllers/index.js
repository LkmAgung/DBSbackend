// Controllers index file
// Export all controllers from this file

module.exports = {
  AuthController: require('./auth.controller'),
  UserController: require('./user.controller'),
  HealthRecordController: require('./healthRecord.controller'),
  PredictionController: require('./prediction.controller')
};
