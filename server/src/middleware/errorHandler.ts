import { Request, Response, NextFunction } from 'express'

/**
 * Global error-handling middleware.
 * Catches unhandled errors and returns a consistent JSON error response.
 */
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error('[ErrorHandler]', err)

  const statusCode = res.statusCode >= 400 ? res.statusCode : 500

  res.status(statusCode).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}

/**
 * 404 handler for unmatched routes.
 */
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: 'Route not found' })
}
