module.exports = require('bunyan').createLogger({
  name: 'autossl',
  level: process.env.LOG_LEVEL || 'info'
})
