/**
 * SQL query strings for goal operations.
 * Extracted here to avoid duplication across route handlers.
 */

export const SQL = {
  INSERT_GOAL: `INSERT INTO goals (id, name, targetAmount, targetDate, balance, created, accountId, transactionIds, tagIds, icon, userId)
    VALUES (@id, @name, @targetAmount, @targetDate, @balance, @created, @accountId, @transactionIds, @tagIds, @icon, @userId)`,

  UPDATE_GOAL: `UPDATE goals SET
    name = @name,
    targetAmount = @targetAmount,
    targetDate = @targetDate,
    balance = @balance,
    created = @created,
    accountId = @accountId,
    transactionIds = @transactionIds,
    tagIds = @tagIds,
    icon = @icon,
    userId = @userId
    WHERE id = @id`,

  SELECT_ALL_GOALS: 'SELECT * FROM goals',

  SELECT_GOAL_BY_ID: 'SELECT * FROM goals WHERE id = ?',

  SELECT_GOALS_BY_USER: 'SELECT * FROM goals WHERE userId = ?',

  SELECT_GOAL_ID: 'SELECT id FROM goals WHERE id = ?',

  DELETE_GOAL: 'DELETE FROM goals WHERE id = ?',
} as const
