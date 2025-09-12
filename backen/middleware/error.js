function errorHandler(err, req, res, next) {
  console.error('[Error]', err.stack)

  const status = err.status || 500
  const message = process.env.NODE_ENV === 'development'
    ? err.message
    : 'Something went wrong'

  res.status(status).json({ error: message })
}

function notFound(req, res) {
  res.status(404).json({ error: 'Endpoint not found' })
}

module.exports = { errorHandler, notFound }
