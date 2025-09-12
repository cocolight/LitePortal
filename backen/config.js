const path = require('path')

module.exports = {
  PORT: process.env.PORT || 8080,
  DB_PATH: path.join(__dirname, 'database.sqlite'),
  NODE_ENV: process.env.NODE_ENV || 'development',
  MAX_BODY_SIZE: '10kb'
}
