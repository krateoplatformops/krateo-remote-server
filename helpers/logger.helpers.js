const pino = require('pino')
const logger = pino({
  transport: {
    target: 'pino-pretty'
  },
  level: process.env.LOG_LEVEL || 'info'
})

module.exports = logger
