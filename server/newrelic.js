'use strict'

exports.config = {
  app_name: ['MiApp-Backend'], // nombre que verás en New Relic
  license_key: process.env.NEW_RELIC_LICENSE_KEY,
  logging: {
    level: 'trace', // puede ser 'trace' si quieres más detalle
  },
  allow_all_headers: true,
  attributes: {
    exclude: [
      'request.headers.cookie',
      'request.headers.authorization',
      'response.headers.setCookie*',
      'response.headers.x*'
    ]
  }
}
