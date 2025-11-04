/**
 * Middleware para manejo de errores
 */
export function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  // Errores de conexión a la blockchain
  if (err.message.includes('network') || err.message.includes('connection')) {
    return res.status(503).json({
      success: false,
      error: 'Service temporarily unavailable',
      message: 'Cannot connect to blockchain. Please try again later.',
      timestamp: new Date().toISOString()
    });
  }

  // Errores de contrato
  if (err.message.includes('contract') || err.message.includes('oracle')) {
    return res.status(500).json({
      success: false,
      error: 'Oracle service error',
      message: err.message,
      timestamp: new Date().toISOString()
    });
  }

  // Error genérico
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message || 'An unexpected error occurred',
    timestamp: new Date().toISOString()
  });
}

