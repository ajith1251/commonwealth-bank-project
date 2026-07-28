import { Request, Response, NextFunction } from 'express'

interface ValidationError {
  field: string
  message: string
}

type ValidationRule = (body: Record<string, unknown>) => ValidationError | null

/**
 * Creates a validation middleware from an array of validation rules.
 * Returns 400 with structured errors if validation fails.
 */
export function validate(...rules: ValidationRule[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const body = req.body ?? {}
    const errors: ValidationError[] = []

    for (const rule of rules) {
      const error = rule(body)
      if (error) errors.push(error)
    }

    if (errors.length > 0) {
      res.status(400).json({ error: 'Validation failed', details: errors })
      return
    }

    next()
  }
}

// ── Individual validation rules ───────────────────────────────────────

export const requiredName: ValidationRule = (body) => {
  const name = body.name
  if (name === undefined || name === null || name === '') {
    return { field: 'name', message: 'Name is required' }
  }
  if (typeof name !== 'string') {
    return { field: 'name', message: 'Name must be a string' }
  }
  return null
}

export const optionalName: ValidationRule = (body) => {
  if (body.name !== undefined && typeof body.name !== 'string') {
    return { field: 'name', message: 'Name must be a string' }
  }
  return null
}

export const positiveTargetAmount: ValidationRule = (body) => {
  if (body.targetAmount !== undefined) {
    const amount = Number(body.targetAmount)
    if (isNaN(amount) || amount < 0) {
      return { field: 'targetAmount', message: 'Target amount must be a non-negative number' }
    }
  }
  return null
}

export const validTargetDate: ValidationRule = (body) => {
  if (body.targetDate !== undefined && body.targetDate !== null) {
    const date = new Date(String(body.targetDate))
    if (isNaN(date.getTime())) {
      return { field: 'targetDate', message: 'Target date must be a valid date string' }
    }
  }
  return null
}

export const requiredUserId: ValidationRule = (body) => {
  const userId = body.userId
  if (userId === undefined || userId === null || userId === '') {
    return { field: 'userId', message: 'User ID is required' }
  }
  if (typeof userId !== 'string') {
    return { field: 'userId', message: 'User ID must be a string' }
  }
  return null
}

export const optionalIcon: ValidationRule = (body) => {
  if (body.icon !== undefined && body.icon !== null && typeof body.icon !== 'string') {
    return { field: 'icon', message: 'Icon must be a string or null' }
  }
  return null
}
