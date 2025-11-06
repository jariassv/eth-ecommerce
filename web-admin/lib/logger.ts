/**
 * Sistema de logging centralizado
 * Proporciona logging con niveles y control de producción/desarrollo
 */

export const logger = {
  /**
   * Log de debug - solo en desarrollo
   */
  debug: (...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[DEBUG]', ...args);
    }
  },

  /**
   * Log de error - siempre visible
   */
  error: (...args: unknown[]) => {
    console.error('[ERROR]', ...args);
  },

  /**
   * Log de advertencia - siempre visible
   */
  warn: (...args: unknown[]) => {
    console.warn('[WARN]', ...args);
  },

  /**
   * Log de información - solo en desarrollo
   */
  info: (...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.info('[INFO]', ...args);
    }
  },
};

